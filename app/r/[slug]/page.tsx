import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { ResumePreview } from "@/components/resume/resume-preview";
import { demoResume } from "@/lib/demo-data";
import { getPublicResume } from "@/services/resume-service";
import { PublicViewTracker } from "@/components/resume/public-view-tracker";
import { ReportResume } from "@/components/resume/report-resume";

export default async function PublicResumePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resume = slug === demoResume.slug ? demoResume : await getPublicResume(slug);
  if (!resume) notFound();
  return (
    <main id="main-content" className="dot-grid min-h-screen bg-[#e3f2f7] px-4 py-8 dark:bg-[#041a2a]">
      <PublicViewTracker slug={slug} />
      <div className="glass no-print mx-auto mb-6 flex max-w-[620px] items-center justify-between rounded-2xl px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold"><span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-sky-700 text-white"><FileText className="size-3.5" /></span>resumly</Link>
        <div className="flex items-center gap-2"><ReportResume slug={slug} /><Link href="/register" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">Build yours</Link></div>
      </div>
      <div className="mx-auto h-[877px] w-[620px] max-w-full overflow-visible"><ResumePreview resume={resume} /></div>
    </main>
  );
}
