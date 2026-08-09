import { NextResponse } from "next/server";
import { ticketListSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { getSupportContent, listSupportTickets } from "@/features/admin/support/server/support-service";
import { csvResponse, rowsToCsv } from "@/features/admin/shared/server/csv";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const url = new URL(request.url);
    if (url.searchParams.get("content") === "true") return NextResponse.json({ ok: true, data: await getSupportContent() });
    const input = ticketListSchema.parse(Object.fromEntries(url.searchParams));
    if (url.searchParams.get("format") === "csv") {
      const rows: Awaited<ReturnType<typeof listSupportTickets>>["items"] = [];
      for (let page = 1; rows.length < 10_000; page += 1) {
        const result = await listSupportTickets({ ...input, page, pageSize: 100 });
        rows.push(...result.items);
        if (page >= result.pagination.pages) break;
      }
      return csvResponse("support-tickets.csv", rowsToCsv(
        ["id", "created_at", "updated_at", "email", "subject", "type", "status", "priority", "assigned_to", "message_count", "resolved_at"],
        rows.map(row => [row.id, row.createdAt, row.updatedAt, row.email, row.subject, row.type, row.status, row.priority, row.assignedTo?.email, row._count.messages, row.resolvedAt]),
      ));
    }
    return NextResponse.json({ ok: true, data: await listSupportTickets(input) });
  } catch (error) {
    return adminRouteError(error);
  }
}
