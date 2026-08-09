import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAccountRetentionDays, revokeSupabaseSessions } from "@/lib/account-lifecycle";
import { sendTransactionalEmail } from "@/lib/email";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";
import type { z } from "zod";
import type { userActionSchema, userListSchema } from "@/features/admin/shared/schemas";

type UserListInput = z.infer<typeof userListSchema>;
type UserAction = z.infer<typeof userActionSchema>;

export async function listAdminUsers(input: UserListInput) {
  const where: Prisma.UserWhereInput = {
    ...(input.q ? { OR: [
      { email: { contains: input.q, mode: "insensitive" } },
      { name: { contains: input.q, mode: "insensitive" } },
      { jobTitle: { contains: input.q, mode: "insensitive" } },
    ] } : {}),
    ...(input.status === "ALL" ? {} : { status: input.status }),
    ...(input.role === "ALL" ? {} : { role: input.role }),
    ...(input.provider === "ALL" ? {} : { authProvider: input.provider }),
  };
  const orderBy: Prisma.UserOrderByWithRelationInput[] = input.sort === "oldest" ? [{ createdAt: "asc" }]
    : input.sort === "name" ? [{ name: "asc" }, { email: "asc" }]
    : input.sort === "activity" ? [{ lastActiveAt: "desc" }, { createdAt: "desc" }]
    : input.sort === "resumes" ? [{ resumes: { _count: "desc" } }, { createdAt: "desc" }]
    : [{ createdAt: "desc" }];
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where, orderBy, skip: (input.page - 1) * input.pageSize, take: input.pageSize,
      select: {
        id: true, email: true, name: true, avatarUrl: true, role: true, status: true,
        authProvider: true, emailVerifiedAt: true, lastLoginAt: true, lastActiveAt: true,
        createdAt: true, deletedAt: true, suspendedAt: true, mustChangePassword: true,
        _count: { select: { resumes: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    items: items.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
      lastActiveAt: item.lastActiveAt?.toISOString() ?? null,
      emailVerifiedAt: item.emailVerifiedAt?.toISOString() ?? null,
      suspendedAt: item.suspendedAt?.toISOString() ?? null,
      deletedAt: item.deletedAt?.toISOString() ?? null,
      resumeCount: item._count.resumes,
      _count: undefined,
    })),
    pagination: { page: input.page, pageSize: input.pageSize, total, pages: Math.max(1, Math.ceil(total / input.pageSize)) },
  };
}

export async function getAdminUserDetail(id: string) {
  const profile = await prisma.user.findUnique({
    where: { id },
    include: {
      resumes: {
        orderBy: { updatedAt: "desc" }, take: 10,
        select: { id: true, title: true, status: true, isPublic: true, template: true, completion: true, updatedAt: true, _count: { select: { events: true, reports: true } } },
      },
      securityEvents: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { resumes: true, supportTickets: true } },
    },
  });
  if (!profile) throw new Error("NOT_FOUND");
  const audit = await prisma.adminAuditLog.findMany({
    where: { targetType: "User", targetId: id },
    orderBy: { createdAt: "desc" }, take: 30,
    include: { actor: { select: { name: true, email: true } } },
  });
  return { profile, audit };
}

async function assertLastAdminSafe(targetId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true, status: true } });
  if (target?.role !== "ADMIN" || target.status !== "ACTIVE") return;
  const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
  if (activeAdmins <= 1) throw new Error("LAST_ADMIN");
}

export async function performUserAction(request: Request, actorId: string, targetId: string, action: UserAction) {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new Error("NOT_FOUND");
  if (targetId === actorId && ["suspend", "delete", "revoke_sessions"].includes(action.action)) throw new Error("SELF_PROTECTED");
  if (targetId === actorId && action.action === "set_role" && action.role !== "ADMIN") throw new Error("SELF_PROTECTED");
  if (action.action === "suspend" || action.action === "delete" || (action.action === "set_role" && action.role === "USER")) {
    await assertLastAdminSafe(targetId);
  }

  const supabase = createSupabaseAdminClient();
  let summary = "";
  let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";

  if (action.action === "suspend") {
    const { error } = await supabase.auth.admin.updateUserById(targetId, { ban_duration: "876000h" });
    if (error) throw error;
    await revokeSupabaseSessions(targetId);
    await prisma.user.update({ where: { id: targetId }, data: { status: "SUSPENDED", suspendedAt: new Date() } });
    summary = `Suspended ${target.email}.`; severity = "WARNING";
  } else if (action.action === "reactivate") {
    const { error } = await supabase.auth.admin.updateUserById(targetId, { ban_duration: "none" });
    if (error) throw error;
    await prisma.user.update({ where: { id: targetId }, data: { status: "ACTIVE", suspendedAt: null, deletedAt: null } });
    summary = `Reactivated ${target.email}.`;
  } else if (action.action === "delete") {
    const { error } = await supabase.auth.admin.updateUserById(targetId, { ban_duration: "876000h", user_metadata: { deleted_by_admin: true } });
    if (error) throw error;
    const deletedAt = new Date();
    const retentionDays = await getAccountRetentionDays();
    await revokeSupabaseSessions(targetId);
    await prisma.user.update({ where: { id: targetId }, data: { status: "DELETED", deletedAt, purgeScheduledAt: new Date(deletedAt.getTime() + retentionDays * 86_400_000) } });
    summary = `Soft-deleted ${target.email}; data remains recoverable for ${retentionDays} days.`; severity = "CRITICAL";
  } else if (action.action === "restore") {
    const { error } = await supabase.auth.admin.updateUserById(targetId, { ban_duration: "none", user_metadata: { deleted_by_admin: false } });
    if (error) throw error;
    await prisma.user.update({ where: { id: targetId }, data: { status: "ACTIVE", deletedAt: null, purgeScheduledAt: null, suspendedAt: null } });
    summary = `Restored ${target.email}.`;
  } else if (action.action === "force_reset") {
    const { error } = await supabase.auth.resetPasswordForEmail(target.email, { redirectTo: `${serverEnv.siteUrl}/reset-password` });
    if (error) throw error;
    await prisma.user.update({ where: { id: targetId }, data: { mustChangePassword: true } });
    summary = `Sent a password recovery email to ${target.email}.`; severity = "WARNING";
  } else if (action.action === "revoke_sessions") {
    await revokeSupabaseSessions(targetId);
    await prisma.user.update({ where: { id: targetId }, data: { mustChangePassword: true } });
    summary = `Revoked sessions for ${target.email}.`; severity = "WARNING";
  } else {
    await prisma.user.update({ where: { id: targetId }, data: { role: action.role } });
    summary = `${action.role === "ADMIN" ? "Granted administrator access to" : "Removed administrator access from"} ${target.email}.`;
    severity = "CRITICAL";
  }

  await writeAdminAudit({
    request, actorId, category: "USER", severity, action: `user.${action.action}`,
    summary, targetType: "User", targetId,
    metadata: { reason: "reason" in action ? action.reason : undefined, newRole: action.action === "set_role" ? action.role : undefined },
  });
  await sendTransactionalEmail({
    to: target.email,
    subject: "Your Blue Horizon CV account was updated",
    heading: "Account update",
    message: summary,
  });
  return { ok: true, summary };
}
