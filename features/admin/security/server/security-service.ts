import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";
import { sendSecurityAlert } from "@/lib/monitoring";

export async function getSecurityCenter(options: { q?: string; severity?: string; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, options.pageSize ?? 30));
  const eventWhere: Prisma.SecurityEventWhereInput = {
    ...(options.q ? { OR: [
      { type: { contains: options.q, mode: "insensitive" } },
      { description: { contains: options.q, mode: "insensitive" } },
      { user: { email: { contains: options.q, mode: "insensitive" } } },
    ] } : {}),
    ...(options.severity && options.severity !== "ALL" ? { severity: options.severity as "INFO" | "WARNING" | "CRITICAL" } : {}),
  };
  const [events, eventTotal, auditLogs, auditTotal, failedLogins, unresolvedCritical, revokedSessions, suspiciousAccounts] = await Promise.all([
    prisma.securityEvent.findMany({
      where: eventWhere, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.securityEvent.count({ where: eventWhere }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" }, take: 50,
      include: { actor: { select: { email: true, name: true } } },
    }),
    prisma.adminAuditLog.count(),
    prisma.securityEvent.count({ where: { type: "FAILED_LOGIN", createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
    prisma.securityEvent.count({ where: { severity: "CRITICAL", resolvedAt: null } }),
    prisma.user.count({ where: { sessionsRevokedAt: { not: null } } }),
    prisma.user.findMany({
      where: { OR: [
        { securityEvents: { some: { severity: "CRITICAL", resolvedAt: null } } },
        { securityEvents: { some: { type: "FAILED_LOGIN", createdAt: { gte: new Date(Date.now() - 86_400_000) } } } },
      ] },
      take: 20, select: { id: true, email: true, name: true, status: true, lastLoginAt: true, _count: { select: { securityEvents: true } } },
    }),
  ]);
  return {
    events, auditLogs, suspiciousAccounts,
    totals: { eventTotal, auditTotal, failedLogins, unresolvedCritical, revokedSessions },
    pagination: { page, pageSize, total: eventTotal, pages: Math.max(1, Math.ceil(eventTotal / pageSize)) },
  };
}

export async function resolveSecurityEvent(request: Request, actorId: string, eventId: string, resolved: boolean) {
  const event = await prisma.securityEvent.update({ where: { id: eventId }, data: { resolvedAt: resolved ? new Date() : null } });
  await writeAdminAudit({
    request, actorId, category: "SECURITY", severity: event.severity,
    action: resolved ? "security.resolve" : "security.reopen",
    summary: `${resolved ? "Resolved" : "Reopened"} security event ${event.type}.`,
    targetType: "SecurityEvent", targetId: event.id,
  });
  return event;
}

export async function getSecurityExport(kind: "events" | "audit") {
  if (kind === "audit") {
    return prisma.adminAuditLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10_000,
      include: { actor: { select: { email: true } } },
    });
  }
  return prisma.securityEvent.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 10_000,
    include: { user: { select: { email: true } } },
  });
}

export async function recordSecurityEvent(input: {
  type: string;
  description: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  userId?: string;
  ipHash?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const event = await prisma.securityEvent.create({ data: { severity: input.severity ?? "INFO", ...input } });
  if (event.severity === "CRITICAL") {
    await sendSecurityAlert({
      level: "critical",
      event: `security_${event.type.toLowerCase()}`,
      message: event.description,
      context: { securityEventId: event.id, userId: event.userId },
    });
  }
  return event;
}
