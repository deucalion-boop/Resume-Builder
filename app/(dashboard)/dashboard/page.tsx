import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requireUser } from "@/lib/auth";
import { demoResumes } from "@/lib/demo-data";
import { ensureUser, listResumes } from "@/services/resume-service";

export default async function DashboardPage() {
  const user = await requireUser();
  await ensureUser(user);
  const resumes = await listResumes(user.id);
  return <DashboardView resumes={resumes.length ? resumes : demoResumes.slice(0, 0)} name={user.user_metadata.full_name || "there"} />;
}

