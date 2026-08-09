import { notFound } from "next/navigation";
import { ResumeEditor } from "@/components/resume/resume-editor";
import { requireUser } from "@/lib/auth";
import { getResume } from "@/services/resume-service";

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const resume = await getResume(user.id, id);
  if (!resume) notFound();
  return <ResumeEditor initialResume={resume} />;
}

