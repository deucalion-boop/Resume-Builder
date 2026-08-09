import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { getAdminUserDetail } from "@/features/admin/users/server/users-service";
import { idSchema } from "@/features/admin/shared/schemas";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const { profile, audit } = await getAdminUserDetail(parsed.data).catch(() => notFound());
  return <>
    <AdminPageHeader eyebrow="User profile" title={profile.name || "Unnamed user"} description={`${profile.email} · Joined ${profile.createdAt.toLocaleDateString()}`} />
    <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
      <div className="space-y-6">
        <Card className="p-5"><h2 className="font-semibold">Account details</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1"><Badge>{profile.status}</Badge></dd></div><div><dt className="text-xs text-muted-foreground">Role</dt><dd className="mt-1 font-medium">{profile.role}</dd></div><div><dt className="text-xs text-muted-foreground">Provider</dt><dd className="mt-1">{profile.authProvider}</dd></div><div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1">{profile.emailVerifiedAt ? "Verified" : "Unverified"}</dd></div><div><dt className="text-xs text-muted-foreground">Last login</dt><dd className="mt-1">{profile.lastLoginAt?.toLocaleString() ?? "Never"}</dd></div><div><dt className="text-xs text-muted-foreground">Last active</dt><dd className="mt-1">{profile.lastActiveAt?.toLocaleString() ?? "Never"}</dd></div></dl></Card>
        <Card className="p-5"><h2 className="font-semibold">Activity summary</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-secondary p-4"><p className="text-2xl font-semibold">{profile._count.resumes}</p><p className="text-xs text-muted-foreground">Resumes</p></div><div className="rounded-xl bg-secondary p-4"><p className="text-2xl font-semibold">{profile._count.supportTickets}</p><p className="text-xs text-muted-foreground">Support requests</p></div></div></Card>
      </div>
      <div className="space-y-6">
        <Card className="overflow-hidden"><div className="border-b border-border p-5"><h2 className="font-semibold">Recent resumes</h2><p className="mt-1 text-xs text-muted-foreground">Metadata only; private resume content is not exposed.</p></div><Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Template</TableHead><TableHead>State</TableHead><TableHead>Activity</TableHead></TableRow></TableHeader><TableBody>{profile.resumes.map(resume => <TableRow key={resume.id}><TableCell className="font-medium">{resume.title}</TableCell><TableCell>{resume.template}</TableCell><TableCell>{resume.isPublic ? "Public" : resume.status}</TableCell><TableCell>{resume._count.events} events · {resume._count.reports} reports</TableCell></TableRow>)}</TableBody></Table>{!profile.resumes.length && <p className="p-8 text-center text-sm text-muted-foreground">This user has not created a resume.</p>}</Card>
        <Card className="p-5"><h2 className="font-semibold">Administrative history</h2><div className="mt-4 space-y-3">{audit.map(log => <div key={log.id} className="rounded-xl border border-border p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{log.summary}</p><Badge>{log.severity}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{log.actor?.name || log.actor?.email || "System"} · {log.createdAt.toLocaleString()}</p></div>)}{!audit.length && <p className="text-sm text-muted-foreground">No administrator actions for this user.</p>}</div></Card>
      </div>
    </div>
  </>;
}
