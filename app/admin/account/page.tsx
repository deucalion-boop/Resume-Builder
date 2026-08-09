import { SettingsForm } from "@/components/settings/settings-form";
import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAccountPage() {
  const { user, profile } = await requireAdmin();
  return <div className="mx-auto max-w-5xl"><AdminPageHeader eyebrow="Administrator" title="My account" description="Manage your administrator identity, profile, email, password, and account security." /><SettingsForm profile={{ name: profile.name || "", email: user.email || profile.email, jobTitle: profile.jobTitle || "", location: profile.location || "", website: profile.website || "", bio: profile.bio || "", role: profile.role }} /></div>;
}
