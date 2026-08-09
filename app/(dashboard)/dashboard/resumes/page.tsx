import { createResumeAction } from "@/app/actions/resumes";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { listResumes } from "@/services/resume-service";

export default async function ResumesPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const resumes = await listResumes(user.id);
  return (
    <>
      {params.new === "true" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h1 className="text-xl font-semibold">Start a new resume</h1>
            <p className="mt-1 text-sm text-muted-foreground">You can change the name and design anytime.</p>
            <form action={createResumeAction} className="mt-6 space-y-4">
              <label className="block text-xs font-semibold">Resume name<Input name="title" className="mt-1.5" defaultValue="Untitled resume" required /></label>
              <label className="block text-xs font-semibold">Template<select name="template" className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="clarity">Clarity</option><option value="modern">Modern</option><option value="executive">Executive</option></select></label>
              <div className="flex justify-end gap-2"><a href="/dashboard/resumes" className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-muted-foreground">Cancel</a><Button type="submit">Create resume</Button></div>
            </form>
          </div>
        </div>
      )}
      <DashboardView resumes={resumes} name={user.user_metadata.full_name || "there"} />
    </>
  );
}

