import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/features/admin/shared/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAdmin();
  if (profile.mustChangePassword) redirect("/change-password");
  return <AdminShell admin={{ name: profile.name || user.user_metadata.full_name || "Administrator", email: profile.email }}>{children}</AdminShell>;
}
