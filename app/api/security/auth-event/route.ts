import { z } from "zod";
import { apiError, sameOrigin } from "@/lib/http";
import { rateLimit, requestFingerprint } from "@/lib/rate-limit";
import { hashRequestValue } from "@/features/admin/shared/server/admin-auth";
import { recordSecurityEvent } from "@/features/admin/security/server/security-service";

const schema = z.object({
  type: z.literal("FAILED_LOGIN"),
  email: z.email(),
});

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
    const fingerprint = requestFingerprint(request);
    const limit = await rateLimit(`auth-event:${fingerprint}`, 12, 60_000);
    if (!limit.allowed) {
      await recordSecurityEvent({ type: "RATE_LIMIT_VIOLATION", severity: "WARNING", description: "Authentication event rate limit exceeded.", ipHash: hashRequestValue(fingerprint), metadata: { route: "/api/security/auth-event" } });
      return apiError("RATE_LIMITED", "Too many authentication attempts.", 429);
    }
    const input = schema.parse(await request.json());
    await recordSecurityEvent({
      type: input.type,
      severity: "WARNING",
      description: "A sign-in attempt failed.",
      ipHash: hashRequestValue(fingerprint),
      metadata: { emailHash: hashRequestValue(input.email.toLowerCase()) },
    });
    return Response.json({ ok: true });
  } catch {
    return apiError("INVALID_EVENT", "The authentication event was not accepted.", 400);
  }
}
