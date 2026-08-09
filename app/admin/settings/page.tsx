import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { SystemSettingsForm } from "@/features/admin/settings/components/system-settings-form";
import { getPlatformSettings } from "@/features/admin/settings/server/settings-service";

export default async function AdminSystemSettingsPage() {
  const settings = await getPlatformSettings();
  return <div className="mx-auto max-w-6xl"><AdminPageHeader eyebrow="Platform configuration" title="System settings" description="Control public branding, registration, OAuth visibility, uploads, templates, sections, maintenance, policies, and SEO." /><SystemSettingsForm initialValues={settings} /></div>;
}
