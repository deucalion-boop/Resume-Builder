import { Activity, FileText, Headphones, ShieldAlert, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { MetricCard } from "@/features/admin/shared/components/metric-card";
import { getAdminAnalytics } from "@/features/admin/analytics/server/analytics-service";
import { getSecurityCenter } from "@/features/admin/security/server/security-service";
import { listSupportTickets } from "@/features/admin/support/server/support-service";

export default async function AdminOverviewPage() {
  const [analytics, security, support] = await Promise.all([
    getAdminAnalytics(),
    getSecurityCenter({ pageSize: 10 }),
    listSupportTickets({ q: "", page: 1, pageSize: 5, status: "ALL", type: "ALL" }),
  ]);
  return <>
    <AdminPageHeader eyebrow="Control center" title="Platform overview" description="A focused view of account growth, content operations, support demand, and security health." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Registered users" value={analytics.totals.totalUsers} detail={`${analytics.totals.newUsers7} joined in 7 days`} icon={Users} />
      <MetricCard label="Active users" value={analytics.totals.activeUsers} detail="Active during the last 30 days" icon={Activity} tone="emerald" />
      <MetricCard label="Resumes" value={analytics.totals.totalResumes} detail={`${analytics.totals.publicResumes} currently public`} icon={FileText} tone="amber" />
      <MetricCard label="Critical alerts" value={security.totals.unresolvedCritical} detail={`${security.totals.failedLogins} failed logins today`} icon={ShieldAlert} tone="rose" />
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Recent administrator activity</h2><p className="mt-1 text-xs text-muted-foreground">Immutable actions across the platform.</p></div><Link href="/admin/security" className="text-xs font-semibold text-primary hover:underline">View audit center</Link></div>
        <div className="divide-y divide-border">
          {security.auditLogs.slice(0, 8).map(log => <div key={log.id} className="flex items-start gap-3 p-4"><span className="mt-1 size-2 rounded-full bg-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{log.summary}</p><p className="mt-1 text-xs text-muted-foreground">{log.actor?.name || log.actor?.email || "System"} · {log.createdAt.toLocaleString()}</p></div><Badge>{log.category}</Badge></div>)}
          {!security.auditLogs.length && <div className="p-10 text-center text-sm text-muted-foreground">No administrator actions have been recorded yet.</div>}
        </div>
      </Card>
      <div className="space-y-6">
        <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Support queue</h2><p className="mt-1 text-xs text-muted-foreground">Requests awaiting attention.</p></div><Headphones className="size-5 text-primary" /></div><div className="mt-5 space-y-3">{support.items.slice(0, 4).map(ticket => <Link key={ticket.id} href={`/admin/support?ticket=${ticket.id}`} className="block rounded-xl border border-border p-3 hover:bg-secondary/50"><div className="flex justify-between gap-3"><p className="truncate text-sm font-medium">{ticket.subject}</p><Badge>{ticket.priority}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{ticket.email}</p></Link>)}{!support.items.length && <p className="rounded-xl bg-secondary/50 p-5 text-center text-xs text-muted-foreground">The support queue is clear.</p>}</div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-4" /></span><div><p className="text-sm font-semibold">30-day conversion</p><p className="text-xs text-muted-foreground">Public view to PDF download</p></div></div><p className="mt-5 text-4xl font-semibold">{analytics.totals.conversionRate}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, analytics.totals.conversionRate)}%` }} /></div></Card>
      </div>
    </div>
  </>;
}
