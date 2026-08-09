import { Download, Eye, FileText, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/services/resume-service";
import { formatRelative } from "@/lib/utils";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const analytics = await getDashboardAnalytics(user.id);
  const max = Math.max(1, ...analytics.days.map(day => day.views));
  return <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-primary">Last 30 days</p><h1 className="horizon-rule mt-1 text-3xl font-semibold tracking-tight">See what’s resonating.</h1><p className="mt-3 text-sm text-muted-foreground">Owner previews are excluded from these public engagement numbers.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Active resumes", value: analytics.resumeCount, icon: FileText }, { label: "Unique daily views", value: analytics.views, icon: Eye }, { label: "Downloads", value: analytics.downloads, icon: Download }, { label: "Conversion", value: `${analytics.conversion}%`, icon: TrendingUp }].map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><Icon className="size-4 text-primary" /><p className="mt-5 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></Card>)}</div>
    <Card className="mt-5 p-6"><h2 className="font-semibold">Daily views</h2><div className="mt-7 flex h-48 items-end gap-1" role="img" aria-label="Resume views over the last 30 days">{analytics.days.map(day => <div key={day.day} className="group relative flex-1 rounded-t bg-primary/25 transition hover:bg-primary" style={{ height: `${Math.max(3, day.views / max * 100)}%` }} title={`${day.day}: ${day.views} views`} />)}</div></Card>
    <Card className="mt-5 p-6"><h2 className="font-semibold">Recently edited</h2><div className="mt-4 divide-y divide-border">{analytics.recent.map(item => <div key={item.id} className="flex justify-between py-3 text-sm"><span className="font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{formatRelative(item.updatedAt)}</span></div>)}</div></Card>
  </div>;
}
