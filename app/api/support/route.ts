import { z } from "zod";
import { apiError, sameOrigin } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, requestFingerprint } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";

const schema = z.object({
  email: z.email(),
  subject: z.string().trim().min(4).max(160),
  type: z.enum(["FEEDBACK", "CONTACT", "ACCOUNT_RECOVERY", "TECHNICAL_ERROR", "ABUSE_REPORT"]),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
    const fingerprint = requestFingerprint(request);
    if (!(await rateLimit(`support:${fingerprint}`, 5, 60 * 60_000)).allowed) return apiError("RATE_LIMITED", "Too many support requests.", 429);
    const input = schema.parse(await request.json());
    const user = await getCurrentUser();
    const ticket = await prisma.supportTicket.create({
      data: {
        requesterId: user?.id, email: input.email, subject: input.subject, type: input.type,
        messages: { create: { authorId: user?.id, body: input.message } },
      },
      select: { id: true },
    });
    await sendTransactionalEmail({
      to: input.email,
      subject: `We received your request: ${input.subject}`,
      heading: "Your support request is in our queue",
      message: `Reference ${ticket.id}. Our team will reply as soon as possible. Keep this reference if you contact us again.`,
    });
    return Response.json({ ok: true, ticketId: ticket.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("VALIDATION_ERROR", "Check the support request fields.", 400, error.flatten());
    return apiError("SUPPORT_REQUEST_FAILED", "The support request could not be submitted.", 500);
  }
}
