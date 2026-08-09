import { z } from "zod";
import { apiError, sameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit, requestFingerprint } from "@/lib/rate-limit";
import { hashRequestValue } from "@/features/admin/shared/server/admin-auth";

const paramsSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]{3,100}$/) });
const reportSchema = z.object({ reason: z.string().trim().min(3).max(120), details: z.string().trim().max(1000).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
    const fingerprint = requestFingerprint(request);
    if (!(await rateLimit(`resume-report:${fingerprint}`, 3, 60 * 60_000)).allowed) return apiError("RATE_LIMITED", "Too many reports have been submitted.", 429);
    const { slug } = paramsSchema.parse(await params);
    const input = reportSchema.parse(await request.json());
    const resume = await prisma.resume.findFirst({ where: { slug, isPublic: true }, select: { id: true } });
    if (!resume) return apiError("NOT_FOUND", "The public resume was not found.", 404);
    await prisma.resumeReport.create({ data: { resumeId: resume.id, reason: input.reason, details: input.details, reporterHash: hashRequestValue(fingerprint) } });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("VALIDATION_ERROR", "The report is invalid.", 400, error.flatten());
    return apiError("REPORT_FAILED", "The report could not be submitted.", 500);
  }
}
