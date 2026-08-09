import { getCurrentUser } from "@/lib/auth";
import { apiError, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { resumeIdSchema } from "@/lib/validation/resume";
import { getResume, recordResumeEvent } from "@/services/resume-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Authentication required.", 401);
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Request origin was rejected.", 403);
  if (!(await rateLimit(`download:${user.id}`, 20, 60_000)).allowed) return apiError("RATE_LIMITED", "Too many exports.", 429);
  const { id } = await params;
  if (!resumeIdSchema.safeParse(id).success) return apiError("INVALID_ID", "Invalid resume identifier.", 400);
  const resume = await getResume(user.id, id);
  if (!resume) return apiError("NOT_FOUND", "Resume not found.", 404);
  await recordResumeEvent(id, "DOWNLOAD");
  return Response.json({ ok: true });
}
