import { ResumeEditor } from "@/components/resume/resume-editor";
import { demoResume } from "@/lib/demo-data";

export default function DemoEditorPage() {
  return <ResumeEditor initialResume={demoResume} demo />;
}

