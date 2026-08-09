import { NextResponse } from "next/server";
import { userListSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { listAdminUsers } from "@/features/admin/users/server/users-service";
import { csvResponse, rowsToCsv } from "@/features/admin/shared/server/csv";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const url = new URL(request.url);
    const input = userListSchema.parse(Object.fromEntries(url.searchParams));
    if (url.searchParams.get("format") === "csv") {
      const rows: Awaited<ReturnType<typeof listAdminUsers>>["items"] = [];
      for (let page = 1; rows.length < 10_000; page += 1) {
        const result = await listAdminUsers({ ...input, page, pageSize: 100 });
        rows.push(...result.items);
        if (page >= result.pagination.pages) break;
      }
      return csvResponse("users.csv", rowsToCsv(
        ["id", "email", "name", "role", "status", "provider", "resumes", "email_verified_at", "last_active_at", "created_at", "deleted_at"],
        rows.map(row => [row.id, row.email, row.name, row.role, row.status, row.authProvider, row.resumeCount, row.emailVerifiedAt, row.lastActiveAt, row.createdAt, row.deletedAt]),
      ));
    }
    return NextResponse.json({ ok: true, data: await listAdminUsers(input) });
  } catch (error) {
    return adminRouteError(error);
  }
}
