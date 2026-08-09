import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { ModerationTable } from "@/features/admin/moderation/components/moderation-table";
import { TemplateManager } from "@/features/admin/moderation/components/template-manager";
import { getTemplateConfigurations, listModerationResumes } from "@/features/admin/moderation/server/moderation-service";

export default async function AdminModerationPage() {
  const [initialData, templates] = await Promise.all([
    listModerationResumes({ q: "", page: 1, pageSize: 20, status: "ALL", suspicious: "ALL", sort: "newest" }),
    getTemplateConfigurations(),
  ]);
  return <><AdminPageHeader eyebrow="Trust & safety" title="Resume moderation" description="Review reports and unusual public traffic while limiting exposure to private resume content." /><TemplateManager templates={templates} /><ModerationTable initialData={initialData} /></>;
}
