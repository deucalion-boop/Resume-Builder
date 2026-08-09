import { DashboardView } from "@/components/dashboard/dashboard-view";
import { demoResumes } from "@/lib/demo-data";

export default function DemoDashboardPage() {
  return <main id="main-content" className="min-h-screen px-4 py-10 sm:px-8"><DashboardView resumes={demoResumes} name="Maya" demo /></main>;
}
