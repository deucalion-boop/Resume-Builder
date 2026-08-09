import { SettingsForm } from "@/components/settings/settings-form";
import { requireUserProfile } from "@/lib/auth";

export default async function SettingsPage() {
  const { user, profile } = await requireUserProfile();
  return <div className="mx-auto max-w-5xl"><p className="text-sm font-semibold text-primary">Account</p><h1 className="horizon-rule mt-1 text-3xl font-semibold tracking-tight">Settings</h1><p className="mb-8 mt-3 text-sm text-muted-foreground">Keep your profile and preferences up to date.</p><SettingsForm profile={{ name: profile.name || "", email: user.email || profile.email, jobTitle: profile.jobTitle || "", location: profile.location || "", website: profile.website || "", bio: profile.bio || "", role: profile.role }} /></div>;
}
