import { getCurrentUser } from "@/lib/auth";
import { apiError, sameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccountRetentionDays, revokeSupabaseSessions } from "@/lib/account-lifecycle";
import { sendTransactionalEmail } from "@/lib/email";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Authentication required.", 401);
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Request origin was rejected.", 403);
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (profile?.role === "ADMIN" && await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }) <= 1) {
    return apiError("LAST_ADMIN", "Create another administrator before deleting this account.", 409);
  }
  const supabase = createSupabaseAdminClient();
  const retentionDays = await getAccountRetentionDays();
  const deletedAt = new Date();
  const purgeScheduledAt = new Date(deletedAt.getTime() + retentionDays * 86_400_000);
  await revokeSupabaseSessions(user.id);
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    ban_duration: "876000h",
    user_metadata: { deletion_requested: true, purge_scheduled_at: purgeScheduledAt.toISOString() },
  });
  if (error) return apiError("AUTH_DELETE_FAILED", "Account deletion could not be scheduled.", 500);
  await prisma.user.update({
    where: { id: user.id },
    data: { status: "DELETED", deletedAt, purgeScheduledAt },
  });
  await sendTransactionalEmail({
    to: user.email!,
    subject: "Your account deletion is scheduled",
    heading: "Account deletion requested",
    message: `Your Blue Horizon CV account is scheduled for permanent deletion on ${purgeScheduledAt.toISOString().slice(0, 10)}. Contact support before that date if you need to recover it.`,
  });
  if (profile?.role === "ADMIN") await writeAdminAudit({ request, actorId: user.id, category: "USER", severity: "CRITICAL", action: "admin.account.delete", summary: `Administrator scheduled their account for deletion after ${retentionDays} days.`, targetType: "User", targetId: user.id });
  const sessionClient = await createSupabaseServerClient();
  await sessionClient.auth.signOut({ scope: "global" });
  return Response.json({ ok: true, status: "scheduled", purgeScheduledAt: purgeScheduledAt.toISOString(), retentionDays }, { status: 202 });
}
