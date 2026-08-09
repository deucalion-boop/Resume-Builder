import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { SecurityCenter } from "@/features/admin/security/components/security-center";
import { getSecurityCenter } from "@/features/admin/security/server/security-service";

export default async function AdminSecurityPage() {
  const data = await getSecurityCenter({ pageSize: 50 });
  return <><AdminPageHeader eyebrow="Security operations" title="Security & audit center" description="Review authentication failures, suspicious accounts, session revocations, API actions, alerts, and administrator history." /><SecurityCenter initialData={data} /></>;
}
