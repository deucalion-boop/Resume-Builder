"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({ name: z.string().min(2).max(80), email: z.email(), jobTitle: z.string().max(120), location: z.string().max(120), website: z.union([z.url(), z.literal("")]), bio: z.string().max(1000) });
type Values = z.infer<typeof schema>;

export function SettingsForm({ profile }: { profile: Values & { role: "USER" | "ADMIN" } }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: profile });
  async function save(values: Values) {
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!response.ok) throw new Error("Could not save your profile.");
      if (values.email !== profile.email) {
        const { error } = await createSupabaseBrowserClient().auth.updateUser({ email: values.email });
        if (error) throw error;
        toast.success("Profile saved. Confirm the email change from your inbox.");
      } else toast.success("Profile updated.");
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Update failed."); }
  }
  async function deleteAccount() {
    const response = await fetch("/api/account", { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) return toast.error(body.error?.message || "Account deletion failed.");
    router.replace("/");
  }
  return <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
    <Card className="p-6"><h2 className="font-semibold">Profile details</h2><p className="mt-1 text-xs text-muted-foreground">Used to personalize your workspace.</p><form onSubmit={handleSubmit(save)}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Full name<Input className="mt-1.5" {...register("name")} /></label><label className="text-xs font-semibold">Email address<Input className="mt-1.5" type="email" {...register("email")} /></label></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Professional headline<Input className="mt-1.5" {...register("jobTitle")} /></label><label className="text-xs font-semibold">Location<Input className="mt-1.5" {...register("location")} /></label></div>
      <label className="mt-4 block text-xs font-semibold">Website<Input className="mt-1.5" {...register("website")} /></label><label className="mt-4 block text-xs font-semibold">Short bio<Textarea className="mt-1.5" {...register("bio")} /></label>
      {Object.keys(errors).length > 0 && <p className="mt-3 text-xs text-red-500">Review the profile fields before saving.</p>}<Button type="submit" disabled={isSubmitting} className="mt-5">Save changes</Button>
    </form></Card>
    <div className="space-y-5"><Card className="p-5"><h3 className="text-sm font-semibold">Account security</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Role: {profile.role.toLowerCase()}. Change your password whenever access may be at risk.</p><Button variant="outline" size="sm" className="mt-4" onClick={async () => { const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(profile.email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` }); if (error) toast.error(error.message); else toast.success("Password change link sent."); }}>Change password</Button></Card>
      <Card className="border-red-500/20 p-5"><h3 className="text-sm font-semibold text-red-500">Danger zone</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Permanently remove your resumes, profile, photos, and login.</p><AlertDialog><AlertDialogTrigger asChild><Button variant="danger" size="sm" className="mt-4">Delete account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Delete your account?</AlertDialogTitle><AlertDialogDescription>This permanently deletes every resume and cannot be undone.</AlertDialogDescription><div className="mt-6 flex justify-end gap-2"><AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="danger" onClick={deleteAccount}>Delete permanently</Button></AlertDialogAction></div></AlertDialogContent></AlertDialog></Card>
    </div></div>;
}
