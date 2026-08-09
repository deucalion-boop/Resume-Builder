import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { AnalyticsDashboard } from "@/features/admin/analytics/components/analytics-dashboard";
import { getAdminAnalytics } from "@/features/admin/analytics/server/analytics-service";

export default async function AdminAnalyticsPage() {
  const data = await getAdminAnalytics();
  return <><AdminPageHeader eyebrow="Business intelligence" title="Platform analytics" description="Account growth, resume creation, public engagement, storage, and measured system performance." /><AnalyticsDashboard data={data} /></>;
}
