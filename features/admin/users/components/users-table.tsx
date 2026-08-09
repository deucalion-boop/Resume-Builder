"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Search, ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserItem = {
  id: string; email: string; name: string | null; role: "USER" | "ADMIN"; status: "ACTIVE" | "SUSPENDED" | "DELETED";
  authProvider: string; emailVerifiedAt: string | null; lastLoginAt: string | null; lastActiveAt: string | null;
  createdAt: string; resumeCount: number; mustChangePassword: boolean;
};
type UsersData = { items: UserItem[]; pagination: { page: number; pageSize: number; total: number; pages: number } };
type Action = "suspend" | "reactivate" | "delete" | "restore" | "force_reset" | "revoke_sessions" | "grant_admin" | "remove_admin";

const statusTone = { ACTIVE: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", SUSPENDED: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300", DELETED: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300" };

async function fetchUsers(filters: Record<string, string | number>) {
  const params = new URLSearchParams(Object.entries(filters).map(([key, value]) => [key, String(value)]));
  const response = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Could not load users.");
  return body.data as UsersData;
}

export function UsersTable({ initialData, currentAdminId }: { initialData: UsersData; currentAdminId: string }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ q: "", status: "ALL", role: "ALL", provider: "ALL", sort: "newest", page: 1, pageSize: 20 });
  const [draftQuery, setDraftQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<{ user: UserItem; action: Action } | null>(null);
  const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["admin-users", filters], queryFn: () => fetchUsers(filters), initialData });

  const mutation = useMutation({
    mutationFn: async ({ id, action, reason: actionReason }: { id: string; action: Action; reason: string }) => {
      const payload = action === "grant_admin" ? { action: "set_role", role: "ADMIN", reason: actionReason }
        : action === "remove_admin" ? { action: "set_role", role: "USER", reason: actionReason }
        : ["force_reset"].includes(action) ? { action }
        : { action, reason: actionReason };
      const response = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "The user action failed.");
      return body;
    },
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const snapshots = queryClient.getQueriesData<UsersData>({ queryKey: ["admin-users"] });
      queryClient.setQueriesData<UsersData>({ queryKey: ["admin-users"] }, current => current ? {
        ...current,
        items: current.items.map(item => item.id !== variables.id ? item : {
          ...item,
          status: variables.action === "suspend" ? "SUSPENDED" : variables.action === "delete" ? "DELETED" : ["reactivate", "restore"].includes(variables.action) ? "ACTIVE" : item.status,
          role: variables.action === "grant_admin" ? "ADMIN" : variables.action === "remove_admin" ? "USER" : item.role,
          mustChangePassword: ["force_reset", "revoke_sessions"].includes(variables.action) ? true : item.mustChangePassword,
        }),
      } : current);
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error(error.message);
    },
    onSuccess: body => toast.success(body.summary),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  function confirmAction() {
    if (!pendingAction) return;
    mutation.mutate({ id: pendingAction.user.id, action: pendingAction.action, reason: reason || "Administrator initiated action." });
    setPendingAction(null); setReason("");
  }

  return <div>
    <form className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[minmax(220px,1fr)_repeat(4,auto)]" onSubmit={event => { event.preventDefault(); setFilters(current => ({ ...current, q: draftQuery, page: 1 })); }}>
      <label className="relative"><span className="sr-only">Search users</span><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={draftQuery} onChange={event => setDraftQuery(event.target.value)} placeholder="Search name, email, or role…" /></label>
      <label><span className="sr-only">Account status</span><select className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value, page: 1 }))}><option value="ALL">All statuses</option><option>ACTIVE</option><option>SUSPENDED</option><option>DELETED</option></select></label>
      <label><span className="sr-only">User role</span><select className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={filters.role} onChange={event => setFilters(current => ({ ...current, role: event.target.value, page: 1 }))}><option value="ALL">All roles</option><option>USER</option><option>ADMIN</option></select></label>
      <label><span className="sr-only">Authentication provider</span><select className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={filters.provider} onChange={event => setFilters(current => ({ ...current, provider: event.target.value, page: 1 }))}><option value="ALL">All providers</option><option value="email">Email</option><option value="google">Google</option><option value="github">GitHub</option></select></label>
      <Button type="submit" variant="outline">Search</Button>
    </form>
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Access</TableHead><TableHead>Verification</TableHead><TableHead>Activity</TableHead><TableHead>Resumes</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {query.data.items.map(user => <TableRow key={user.id}>
            <TableCell><Link href={`/admin/users/${user.id}`} className="font-semibold hover:text-primary hover:underline">{user.name || "Unnamed user"}</Link><p className="mt-1 text-xs text-muted-foreground">{user.email}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{user.authProvider}</p></TableCell>
            <TableCell><div className="flex flex-wrap gap-1.5"><Badge className={statusTone[user.status]}>{user.status}</Badge>{user.role === "ADMIN" && <Badge className="border-primary/20 bg-primary/10 text-primary"><ShieldCheck className="mr-1 size-3" />ADMIN</Badge>}</div></TableCell>
            <TableCell><span className={user.emailVerifiedAt ? "text-emerald-600" : "text-amber-600"}>{user.emailVerifiedAt ? "Verified" : "Unverified"}</span>{user.mustChangePassword && <p className="mt-1 text-[10px] text-amber-600">Password change required</p>}</TableCell>
            <TableCell><p>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : "Never"}</p><p className="mt-1 text-xs text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p></TableCell>
            <TableCell>{user.resumeCount}</TableCell>
            <TableCell><div className="flex justify-end"><label><span className="sr-only">Action for {user.email}</span><select className="h-9 max-w-40 rounded-lg border border-border bg-background px-2 text-xs" value="" onChange={event => { const action = event.target.value as Action; if (action) setPendingAction({ user, action }); }}>
              <option value="">Manage…</option>
              {user.status === "ACTIVE" ? <option value="suspend">Suspend</option> : <option value="reactivate">Reactivate</option>}
              {user.status === "DELETED" ? <option value="restore">Restore</option> : <option value="delete">Soft delete</option>}
              <option value="force_reset">Force password reset</option><option value="revoke_sessions">Revoke sessions</option>
              {user.role === "ADMIN" ? <option value="remove_admin" disabled={user.id === currentAdminId}>Remove admin</option> : <option value="grant_admin">Grant admin</option>}
            </select></label></div></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
      {!query.data.items.length && <div className="p-14 text-center"><UserRoundX className="mx-auto size-9 text-muted-foreground" /><h3 className="mt-4 font-semibold">No users match these filters</h3><p className="mt-1 text-sm text-muted-foreground">Try a broader search or clear a status filter.</p></div>}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground"><span>{query.data.pagination.total} users</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={filters.page <= 1 || query.isFetching} onClick={() => setFilters(current => ({ ...current, page: current.page - 1 }))}>Previous</Button><span>Page {query.data.pagination.page} of {query.data.pagination.pages}</span><Button variant="outline" size="sm" disabled={filters.page >= query.data.pagination.pages || query.isFetching} onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))}>Next</Button></div></div>
    </div>
    <AlertDialog open={Boolean(pendingAction)} onOpenChange={open => { if (!open) { setPendingAction(null); setReason(""); } }}>
      <AlertDialogContent>
        <AlertDialogTitle className="flex items-center gap-2"><MoreHorizontal className="size-4" />Confirm administrator action</AlertDialogTitle>
        <AlertDialogDescription>This will perform <strong>{pendingAction?.action.replaceAll("_", " ")}</strong> for {pendingAction?.user.email}. The action will be recorded in the audit trail.</AlertDialogDescription>
        {!["force_reset"].includes(pendingAction?.action ?? "") && <label className="mt-4 block text-sm font-medium">Reason<Textarea className="mt-1.5" value={reason} onChange={event => setReason(event.target.value)} placeholder="Explain why this action is necessary…" /></label>}
        <div className="mt-6 flex justify-end gap-2"><AlertDialogCancel className="h-10 rounded-xl border border-border px-4 text-sm font-semibold">Cancel</AlertDialogCancel><AlertDialogAction asChild><Button onClick={confirmAction} disabled={mutation.isPending || (!reason.trim() && pendingAction?.action !== "force_reset")}><UserRoundCheck className="size-4" />Confirm</Button></AlertDialogAction></div>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
