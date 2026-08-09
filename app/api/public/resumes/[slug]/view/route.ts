import { createHash } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { apiError, sameOrigin } from "@/lib/http";
import { rateLimit, requestFingerprint } from "@/lib/rate-limit";
import { slugSchema } from "@/lib/validation/resume";
import { getPublicResumeOwner, recordResumeEvent } from "@/services/resume-service";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Request origin was rejected.", 403);
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) return apiError("INVALID_SLUG", "Invalid public link.", 400);
  const fingerprint = requestFingerprint(request);
  if (!(await rateLimit(`view:${fingerprint}`, 30, 60_000)).allowed) return apiError("RATE_LIMITED", "Too many requests.", 429);
  const resume = await getPublicResumeOwner(slug);
  if (!resume) return apiError("NOT_FOUND", "Resume not found.", 404);
  const user = await getCurrentUser();
  if (user?.id === resume.userId) return Response.json({ ok: true, counted: false });
  const salt = serverEnv.analyticsHashSalt || "development-only-analytics-salt";
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHash("sha256").update(`${salt}:${fingerprint}:${request.headers.get("user-agent")}:${day}`).digest("hex");
  await recordResumeEvent(resume.id, "VIEW", visitorHash);
  return Response.json({ ok: true, counted: true });
}
