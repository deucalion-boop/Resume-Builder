import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPlatformSettings } from "@/features/admin/settings/server/settings-service";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [profile, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { mustChangePassword: true, role: true } }),
    getPlatformSettings(),
  ]);
  if (profile?.mustChangePassword) redirect("/change-password");
  if (settings.maintenanceMode && profile?.role !== "ADMIN") redirect("/auth-error?message=maintenance");
  return <AppShell user={{ name: user.user_metadata.full_name || user.email?.split("@")[0] || "Resumly User", email: user.email || "", isAdmin: profile?.role === "ADMIN" }}>{children}</AppShell>;
}
