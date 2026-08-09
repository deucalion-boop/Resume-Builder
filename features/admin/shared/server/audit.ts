import "server-only";

import type { AuditCategory, AuditSeverity, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requestAuditContext } from "@/features/admin/shared/server/admin-auth";

export async function writeAdminAudit(input: {
  request: Request;
  actorId: string;
  category: AuditCategory;
  severity?: AuditSeverity;
  action: string;
  summary: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const context = requestAuditContext(input.request);
  return prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      category: input.category,
      severity: input.severity ?? "INFO",
      action: input.action,
      summary: input.summary,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
      ...context,
    },
  });
}
