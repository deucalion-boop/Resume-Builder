"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createResumeSchema, resumeIdSchema, resumeManageSchema } from "@/lib/validation/resume";
import { createResume, deleteResume, duplicateResume, ensureUser, manageResume } from "@/services/resume-service";

export async function createResumeAction(formData?: FormData) {
  const user = await requireUser();
  await ensureUser(user);
  const parsed = createResumeSchema.parse({
    title: formData?.get("title") || "Untitled resume",
    template: formData?.get("template") || "clarity",
  });
  const id = await createResume(user.id, parsed.title, parsed.template);
  redirect(`/resumes/${id}/edit`);
}

export async function duplicateResumeAction(id: string) {
  resumeIdSchema.parse(id);
  const user = await requireUser();
  await duplicateResume(user.id, id);
  revalidatePath("/dashboard");
}

export async function deleteResumeAction(id: string) {
  resumeIdSchema.parse(id);
  const user = await requireUser();
  await deleteResume(user.id, id);
  revalidatePath("/dashboard");
}

export async function manageResumeAction(id: string, input: unknown) {
  resumeIdSchema.parse(id);
  const operation = resumeManageSchema.parse(input);
  const user = await requireUser();
  await manageResume(user.id, id, operation);
  revalidatePath("/dashboard");
  return { ok: true };
}
