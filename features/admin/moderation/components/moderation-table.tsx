"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileSearch, Link2Off, RefreshCw, ShieldX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ModerationItem = {
  id: string; title: string; slug: string; isPublic: boolean; status: string; template: string;
  moderationHiddenAt: string | Date | null; moderationReason: string | null; updatedAt: string | Date;
  user: { id: string; email: string; name: string | null; status: string };
  reports: { id: string; reason: string; status: string; createdAt: string | Date }[];
  _count: { reports: number; events: number }; views24h: number; downloads24h: number; suspicious: boolean;
};
type Data = { items: ModerationItem[]; pagination: { page: number; pageSize: number; total: number; pages: number } };
type Action = "disable_link" | "regenerate_link" | "remove_content";

async function fetchModeration(filters: Record<string, string | number>) {
  const params = new URLSearchParams(Object.entries(filters).map(([key, value]) => [key, String(value)]));
  const response = await fetch(`/api/admin/resumes?${params}`, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Could not load moderation records.");
  return body.data as Data;
}

export function ModerationTable({ initialData }: { initialData: Data }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ q: "", status: "ALL", suspicious: "ALL", sort: "newest", page: 1, pageSize: 20 });
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<{ resume: ModerationItem; action: Action } | null>(null);
  const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["admin-moderation", filters], queryFn: () => fetchModeration(filters), initialData });
  const mutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: Action; reason: string }) => {
      const response = await fetch(`/api/admin/resumes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Moderation failed.");
      return body;
    },
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey: ["admin-moderation"] });
      const snapshots = queryClient.getQueriesData<Data>({ queryKey: ["admin-moderation"] });
      queryClient.setQueriesData<Data>({ queryKey: ["admin-moderation"] }, current => current ? { ...current, items: current.items.map(item => item.id !== variables.id ? item : { ...item, isPublic: variables.action === "regenerate_link" ? item.isPublic : false, status: variables.action === "remove_content" ? "ARCHIVED" : item.status, moderationHiddenAt: variables.action === "regenerate_link" ? null : new Date().toISOString(), moderationReason: variables.reason }) } : current);
      return { snapshots };
    },
    onError: (error, _variables, context) => { context?.snapshots.forEach(([key, value]) => queryClient.setQueryData(key, value)); toast.error(error.message); },
    onSuccess: body => toast.success(body.summary),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-moderation"] }),
  });
  return <>
    <form className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_auto_auto_auto]" onSubmit={event => { event.preventDefault(); setFilters(current => ({ ...current, q: draft, page: 1 })); }}>
      <label className="relative"><span className="sr-only">Search moderated resumes</span><FileSearch className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Search title, slug, or owner…" /></label>
      <label><span className="sr-only">Report status</span><select className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value, page: 1 }))}><option value="ALL">All reports</option><option>OPEN</option><option>REVIEWING</option><option>RESOLVED</option><option>DISMISSED</option></select></label>
      <label><span className="sr-only">Suspicious activity</span><select className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={filters.suspicious} onChange={event => setFilters(current => ({ ...current, suspicious: event.target.value, page: 1 }))}><option value="ALL">All activity</option><option value="YES">Suspicious only</option></select></label>
      <Button type="submit" variant="outline">Search</Button>
    </form>
    <div className="overflow-hidden rounded-2xl border border-border bg-card"><Table><TableHeader><TableRow><TableHead>Resume</TableHead><TableHead>Owner</TableHead><TableHead>Signals</TableHead><TableHead>Public state</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{query.data.items.map(resume => <TableRow key={resume.id}>
      <TableCell><Link href={`/admin/moderation/${resume.id}`} className="font-semibold hover:text-primary hover:underline">{resume.title}</Link><p className="mt-1 text-xs text-muted-foreground">/{resume.slug} · {resume.template}</p></TableCell>
      <TableCell><Link href={`/admin/users/${resume.user.id}`} className="text-sm hover:underline">{resume.user.name || resume.user.email}</Link><p className="mt-1 text-xs text-muted-foreground">{resume.user.email}</p></TableCell>
      <TableCell><div className="flex flex-wrap gap-1.5">{resume._count.reports > 0 && <Badge className="text-amber-700 dark:text-amber-300">{resume._count.reports} reports</Badge>}{resume.suspicious && <Badge className="border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"><AlertTriangle className="mr-1 size-3" />Suspicious</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{resume.views24h} views · {resume.downloads24h} downloads / 24h</p></TableCell>
      <TableCell>{resume.moderationHiddenAt ? <Badge className="border-rose-500/20 bg-rose-500/10 text-rose-700">Moderated</Badge> : resume.isPublic ? <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">Public</Badge> : <Badge>Private</Badge>}</TableCell>
      <TableCell><div className="flex justify-end"><label><span className="sr-only">Moderation action for {resume.title}</span><select className="h-9 rounded-lg border border-border bg-background px-2 text-xs" value="" onChange={event => { const action = event.target.value as Action; if (action) setPending({ resume, action }); }}><option value="">Moderate…</option><option value="disable_link">Disable public link</option><option value="regenerate_link">Regenerate link</option><option value="remove_content">Remove from public access</option></select></label></div></TableCell>
    </TableRow>)}</TableBody></Table>{!query.data.items.length && <div className="p-14 text-center"><ShieldX className="mx-auto size-9 text-muted-foreground" /><h3 className="mt-4 font-semibold">No moderation records</h3><p className="mt-1 text-sm text-muted-foreground">No public or reported resumes match these filters.</p></div>}<div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground"><span>{query.data.pagination.total} records</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters(current => ({ ...current, page: current.page - 1 }))}>Previous</Button><span>{query.data.pagination.page} / {query.data.pagination.pages}</span><Button variant="outline" size="sm" disabled={filters.page >= query.data.pagination.pages} onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))}>Next</Button></div></div></div>
    <AlertDialog open={Boolean(pending)} onOpenChange={open => { if (!open) { setPending(null); setReason(""); } }}><AlertDialogContent><AlertDialogTitle>{pending?.action === "regenerate_link" ? "Regenerate public link?" : pending?.action === "disable_link" ? "Disable public access?" : "Remove this resume from public access?"}</AlertDialogTitle><AlertDialogDescription>This action affects “{pending?.resume.title}” and will be visible in moderation and security history.</AlertDialogDescription><label className="mt-4 block text-sm font-medium">Moderation reason<Textarea className="mt-1.5" value={reason} onChange={event => setReason(event.target.value)} /></label><div className="mt-6 flex justify-end gap-2"><AlertDialogCancel className="h-10 rounded-xl border border-border px-4 text-sm font-semibold">Cancel</AlertDialogCancel><AlertDialogAction asChild><Button onClick={() => { if (pending) mutation.mutate({ id: pending.resume.id, action: pending.action, reason }); setPending(null); setReason(""); }} disabled={reason.trim().length < 5}>{pending?.action === "regenerate_link" ? <RefreshCw className="size-4" /> : <Link2Off className="size-4" />}Confirm</Button></AlertDialogAction></div></AlertDialogContent></AlertDialog>
  </>;
}
