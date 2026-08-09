import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resumePatchSchema } from "@/lib/validation/resume";
import { getResume, saveResumeBasics } from "@/services/resume-service";
import { apiError, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { resumeIdSchema } from "@/lib/validation/resume";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!resumeIdSchema.safeParse(id).success) return apiError("INVALID_ID", "Invalid resume identifier.", 400);
  const resume = await getResume(user.id, id);
  return resume ? NextResponse.json(resume) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Authentication required.", 401);
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Request origin was rejected.", 403);
  if (!(await rateLimit(`save:${user.id}`, 90, 60_000)).allowed) return apiError("RATE_LIMITED", "Too many save requests.", 429);
  const payload = resumePatchSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: "Invalid resume data", details: payload.error.flatten() }, { status: 400 });
  const { id } = await params;
  if (!resumeIdSchema.safeParse(id).success) return apiError("INVALID_ID", "Invalid resume identifier.", 400);
  try {
    return NextResponse.json(await saveResumeBasics(user.id, id, payload.data));
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_CONFLICT") return apiError("VERSION_CONFLICT", "This resume changed elsewhere. Refresh before saving again.", 409);
    return apiError("SAVE_FAILED", error instanceof Error && error.message === "Resume not found." ? "Resume not found." : "Unable to save the resume.", error instanceof Error && error.message === "Resume not found." ? 404 : 500);
  }
}
