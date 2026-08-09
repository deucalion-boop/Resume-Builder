import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, sameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  jobTitle: z.string().trim().max(120),
  location: z.string().trim().max(120),
  website: z.union([z.url(), z.literal("")]),
  bio: z.string().trim().max(1000),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Authentication required.", 401);
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, status: true, mustChangePassword: true } });
  if (!profile) return apiError("PROFILE_NOT_FOUND", "The user profile was not found.", 404);
  return Response.json({ ok: true, data: profile });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Authentication required.", 401);
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Request origin was rejected.", 403);
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Review the highlighted profile fields.", 400, parsed.error.flatten());
  const profile = await prisma.user.update({ where: { id: user.id }, data: parsed.data, select: { role: true } });
  if (profile.role === "ADMIN") await writeAdminAudit({ request, actorId: user.id, category: "USER", action: "admin.profile.update", summary: "Updated administrator profile information.", targetType: "User", targetId: user.id });
  return Response.json({ ok: true });
}
