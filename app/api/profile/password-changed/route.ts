import { getCurrentUser } from "@/lib/auth";
import { apiError, sameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Authentication required.", 401);
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Request origin was rejected.", 403);
  const profile = await prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false }, select: { role: true } });
  if (profile.role === "ADMIN") await writeAdminAudit({ request, actorId: user.id, category: "AUTH", severity: "WARNING", action: "admin.password.changed", summary: "Completed the required administrator password change.", targetType: "User", targetId: user.id });
  return Response.json({ ok: true, data: { role: profile.role } });
}
