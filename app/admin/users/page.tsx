import { Users } from "lucide-react";
import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { MetricCard } from "@/features/admin/shared/components/metric-card";
import { UsersTable } from "@/features/admin/users/components/users-table";
import { listAdminUsers } from "@/features/admin/users/server/users-service";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const { profile } = await requireAdmin();
  const [initialData, active, suspended, admins] = await Promise.all([
    listAdminUsers({ q: "", page: 1, pageSize: 20, status: "ALL", role: "ALL", provider: "ALL", sort: "newest" }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }),
  ]);
  return <>
    <AdminPageHeader eyebrow="Identity & access" title="User management" description="Search and inspect accounts, control access, recover users, and manage administrator privileges." />
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><MetricCard label="Active accounts" value={active} detail="Able to access the platform" icon={Users} /><MetricCard label="Suspended" value={suspended} detail="Access currently blocked" icon={Users} tone="amber" /><MetricCard label="Administrators" value={admins} detail="Active privileged accounts" icon={Users} tone="rose" /></div>
    <UsersTable initialData={initialData} currentAdminId={profile.id} />
  </>;
}
