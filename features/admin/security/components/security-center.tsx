"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileClock, KeyRound, ShieldAlert, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "@/features/admin/shared/components/metric-card";

type SecurityData = {
  events: { id: string; type: string; severity: "INFO" | "WARNING" | "CRITICAL"; description: string; resolvedAt: string | Date | null; createdAt: string | Date; user: { email: string; name: string | null } | null }[];
  auditLogs: { id: string; action: string; summary: string; category: string; severity: string; createdAt: string | Date; actor: { email: string; name: string | null } | null }[];
  suspiciousAccounts: { id: string; email: string; name: string | null; status: string; lastLoginAt: string | Date | null; _count: { securityEvents: number } }[];
  totals: { eventTotal: number; auditTotal: number; failedLogins: number; unresolvedCritical: number; revokedSessions: number };
};

export function SecurityCenter({ initialData }: { initialData: SecurityData }) {
  const [tab, setTab] = useState<"events" | "audit" | "accounts">("events");
  const [events, setEvents] = useState(initialData.events);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ eventId, resolved }: { eventId: string; resolved: boolean }) => {
      const response = await fetch("/api/admin/security", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, resolved }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Could not update the security event.");
      return body;
    },
    onMutate: variables => {
      const previous = events;
      setEvents(current => current.map(event => event.id === variables.eventId ? { ...event, resolvedAt: variables.resolved ? new Date().toISOString() : null } : event));
      return { previous };
    },
    onError: (error, _variables, context) => { if (context) setEvents(context.previous); toast.error(error.message); },
    onSuccess: () => toast.success("Security event updated."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-security"] }),
  });
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Failed logins" value={initialData.totals.failedLogins} detail="During the last 24 hours" icon={KeyRound} tone="amber" />
      <MetricCard label="Critical alerts" value={initialData.totals.unresolvedCritical} detail="Unresolved events" icon={ShieldAlert} tone="rose" />
      <MetricCard label="Revoked sessions" value={initialData.totals.revokedSessions} detail="Accounts with a revocation marker" icon={UserX} />
      <MetricCard label="Audit entries" value={initialData.totals.auditTotal} detail="Immutable administrator actions" icon={FileClock} tone="emerald" />
    </div>
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex rounded-xl bg-secondary p-1" role="tablist" aria-label="Security center views">{(["events", "audit", "accounts"] as const).map(value => <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${tab === value ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{value === "accounts" ? "Suspicious accounts" : value}</button>)}</div><Link href="/admin/settings" className="text-xs font-semibold text-primary hover:underline">Manage OAuth providers</Link></div>
      {tab === "events" && <Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Severity</TableHead><TableHead>User</TableHead><TableHead>Recorded</TableHead><TableHead className="text-right">Resolution</TableHead></TableRow></TableHeader><TableBody>{events.map(event => <TableRow key={event.id}><TableCell><p className="font-semibold">{event.type.replaceAll("_", " ")}</p><p className="mt-1 max-w-lg text-xs text-muted-foreground">{event.description}</p></TableCell><TableCell><Badge className={event.severity === "CRITICAL" ? "border-rose-500/20 bg-rose-500/10 text-rose-700" : event.severity === "WARNING" ? "border-amber-500/20 bg-amber-500/10 text-amber-700" : ""}>{event.severity}</Badge></TableCell><TableCell>{event.user?.name || event.user?.email || "Anonymous"}</TableCell><TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => mutation.mutate({ eventId: event.id, resolved: !event.resolvedAt })}>{event.resolvedAt ? <><AlertTriangle className="size-3.5" />Reopen</> : <><CheckCircle2 className="size-3.5" />Resolve</>}</Button></TableCell></TableRow>)}</TableBody></Table>}
      {tab === "audit" && <Table><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Category</TableHead><TableHead>Administrator</TableHead><TableHead>Time</TableHead></TableRow></TableHeader><TableBody>{initialData.auditLogs.map(log => <TableRow key={log.id}><TableCell><p className="font-semibold">{log.summary}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{log.action}</p></TableCell><TableCell><Badge>{log.category}</Badge></TableCell><TableCell>{log.actor?.name || log.actor?.email || "System"}</TableCell><TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table>}
      {tab === "accounts" && <Table><TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Status</TableHead><TableHead>Security signals</TableHead><TableHead>Last login</TableHead></TableRow></TableHeader><TableBody>{initialData.suspiciousAccounts.map(user => <TableRow key={user.id}><TableCell><Link href={`/admin/users/${user.id}`} className="font-semibold hover:underline">{user.name || user.email}</Link><p className="text-xs text-muted-foreground">{user.email}</p></TableCell><TableCell><Badge>{user.status}</Badge></TableCell><TableCell>{user._count.securityEvents}</TableCell><TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</TableCell></TableRow>)}</TableBody></Table>}
      {((tab === "events" && !events.length) || (tab === "audit" && !initialData.auditLogs.length) || (tab === "accounts" && !initialData.suspiciousAccounts.length)) && <div className="p-14 text-center"><CheckCircle2 className="mx-auto size-9 text-emerald-500" /><h3 className="mt-4 font-semibold">Nothing requires attention</h3><p className="mt-1 text-sm text-muted-foreground">This security view is currently clear.</p></div>}
    </Card>
  </>;
}
