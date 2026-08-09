"use client";

import { useMemo, useState } from "react";
import { BarChart3, Download, Eye, FileDown, Gauge, HardDrive, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/features/admin/shared/components/metric-card";

type Analytics = {
  totals: { totalUsers: number; activeUsers: number; newUsers30: number; newUsers7: number; totalResumes: number; publicResumes: number; views: number; downloads: number; conversionRate: number; storageBytes: number | null; databaseLatencyMs: number };
  days: { day: string; users: number; resumes: number; views: number; downloads: number }[];
  weekly: { label: string; views: number; downloads: number; users: number }[];
  templates: { template: string; count: number }[];
  generatedAt: string;
};

function bytes(value: number | null) {
  if (value === null) return "Unavailable";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function AnalyticsDashboard({ data }: { data: Analytics }) {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const points = useMemo(() => range === "daily" ? data.days.slice(-14).map(item => ({ label: item.day.slice(5), views: item.views, downloads: item.downloads, users: item.users }))
    : range === "weekly" ? data.weekly
    : [{ label: "Last 30 days", views: data.totals.views, downloads: data.totals.downloads, users: data.totals.newUsers30 }], [data, range]);
  const maxValue = Math.max(1, ...points.flatMap(point => [point.views, point.downloads, point.users]));
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total users" value={data.totals.totalUsers} detail={`${data.totals.newUsers30} new in 30 days`} icon={Users} />
      <MetricCard label="Public views" value={data.totals.views} detail="Last 30 days" icon={Eye} tone="emerald" />
      <MetricCard label="PDF downloads" value={data.totals.downloads} detail={`${data.totals.conversionRate}% conversion`} icon={FileDown} tone="amber" />
      <MetricCard label="Storage" value={bytes(data.totals.storageBytes)} detail={`${data.totals.databaseLatencyMs}ms database aggregate`} icon={HardDrive} tone="rose" />
    </div>
    <Card className="mt-6 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Platform usage</h2><p className="mt-1 text-xs text-muted-foreground">Registrations, public views, and successful PDF downloads.</p></div><div className="flex rounded-xl bg-secondary p-1" role="group" aria-label="Analytics interval">{(["daily", "weekly", "monthly"] as const).map(item => <button key={item} onClick={() => setRange(item)} aria-pressed={range === item} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${range === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{item}</button>)}</div></div>
      <div className="mt-8 flex h-64 items-end gap-2 overflow-x-auto border-b border-border px-1" role="img" aria-label={`${range} usage chart`}>
        {points.map(point => <div key={point.label} className="group flex h-full min-w-12 flex-1 items-end justify-center gap-1" title={`${point.label}: ${point.users} users, ${point.views} views, ${point.downloads} downloads`}>
          <div className="w-2.5 rounded-t bg-primary/45 transition-all group-hover:bg-primary" style={{ height: `${Math.max(2, point.users / maxValue * 100)}%` }} /><div className="w-2.5 rounded-t bg-emerald-500/55 transition-all group-hover:bg-emerald-500" style={{ height: `${Math.max(2, point.views / maxValue * 100)}%` }} /><div className="w-2.5 rounded-t bg-amber-500/65 transition-all group-hover:bg-amber-500" style={{ height: `${Math.max(2, point.downloads / maxValue * 100)}%` }} /><span className="absolute sr-only">{point.label}: {point.users} users, {point.views} views, {point.downloads} downloads</span>
        </div>)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground"><span><i className="mr-1 inline-block size-2 rounded-full bg-primary" />New users</span><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />Views</span><span><i className="mr-1 inline-block size-2 rounded-full bg-amber-500" />Downloads</span></div>
    </Card>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card className="p-5"><div className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" /><h2 className="font-semibold">Template adoption</h2></div><div className="mt-5 space-y-4">{data.templates.map(template => { const percentage = data.totals.totalResumes ? Math.round(template.count / data.totals.totalResumes * 100) : 0; return <div key={template.template}><div className="flex justify-between text-sm"><span className="capitalize">{template.template}</span><span className="text-muted-foreground">{template.count} · {percentage}%</span></div><div className="mt-2 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} /></div></div>; })}{!data.templates.length && <p className="text-sm text-muted-foreground">No template usage data yet.</p>}</div></Card>
      <Card className="p-5"><div className="flex items-center gap-2"><Gauge className="size-4 text-primary" /><h2 className="font-semibold">System health</h2></div><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between border-b border-border pb-3"><dt className="text-muted-foreground">Database aggregate latency</dt><dd className="font-semibold">{data.totals.databaseLatencyMs}ms</dd></div><div className="flex justify-between border-b border-border pb-3"><dt className="text-muted-foreground">Active users / total</dt><dd className="font-semibold">{data.totals.activeUsers} / {data.totals.totalUsers}</dd></div><div className="flex justify-between border-b border-border pb-3"><dt className="text-muted-foreground">Public resumes / total</dt><dd className="font-semibold">{data.totals.publicResumes} / {data.totals.totalResumes}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Generated</dt><dd className="font-semibold">{new Date(data.generatedAt).toLocaleTimeString()}</dd></div></dl><Button variant="outline" className="mt-6 w-full" onClick={() => { location.href = "/api/admin/analytics?format=csv"; }}><Download className="size-4" />Export 30-day CSV</Button></Card>
    </div>
  </>;
}
