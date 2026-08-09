import { NextResponse } from "next/server";
import { analyticsToCsv, getAdminAnalytics } from "@/features/admin/analytics/server/analytics-service";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";

export async function GET(request: Request) {
  try {
    const { profile } = await requireAdminRequest(request);
    const data = await getAdminAnalytics();
    if (new URL(request.url).searchParams.get("format") === "csv") {
      await writeAdminAudit({ request, actorId: profile.id, category: "SYSTEM", action: "analytics.export", summary: "Exported the 30-day platform analytics report.", targetType: "AnalyticsReport" });
      return new NextResponse(analyticsToCsv(data), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="resumly-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminRouteError(error);
  }
}
