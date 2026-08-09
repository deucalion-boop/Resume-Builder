import { NextResponse } from "next/server";
import { z } from "zod";
import { securityResolveSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { getSecurityCenter, getSecurityExport, resolveSecurityEvent } from "@/features/admin/security/server/security-service";
import { csvResponse, rowsToCsv } from "@/features/admin/shared/server/csv";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  severity: z.enum(["ALL", "INFO", "WARNING", "CRITICAL"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const url = new URL(request.url);
    if (url.searchParams.get("format") === "csv") {
      const kind = url.searchParams.get("kind") === "audit" ? "audit" : "events";
      const rows = await getSecurityExport(kind);
      if (kind === "audit") {
        return csvResponse("audit-log.csv", rowsToCsv(
          ["id", "created_at", "severity", "category", "action", "actor", "target_type", "target_id", "summary"],
          rows.map(row => "category" in row ? [row.id, row.createdAt, row.severity, row.category, row.action, row.actor?.email, row.targetType, row.targetId, row.summary] : []),
        ));
      }
      return csvResponse("security-events.csv", rowsToCsv(
        ["id", "created_at", "severity", "type", "user", "description", "resolved_at"],
        rows.map(row => "type" in row ? [row.id, row.createdAt, row.severity, row.type, row.user?.email, row.description, row.resolvedAt] : []),
      ));
    }
    const input = querySchema.parse(Object.fromEntries(url.searchParams));
    return NextResponse.json({ ok: true, data: await getSecurityCenter(input) });
  } catch (error) {
    return adminRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const input = securityResolveSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await resolveSecurityEvent(request, profile.id, input.eventId, input.resolved) });
  } catch (error) {
    return adminRouteError(error);
  }
}
