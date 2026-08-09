"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const emailSchema = z.object({ email: z.email() });
const passwordSchema = z.object({
  password: z.string().min(12).regex(/[A-Z]/, "Add an uppercase letter.").regex(/[a-z]/, "Add a lowercase letter.").regex(/[0-9]/, "Add a number."),
  confirm: z.string(),
}).refine(value => value.password === value.confirm, { path: ["confirm"], message: "Passwords do not match." });

export function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) });
  return <form className="space-y-4" onSubmit={handleSubmit(async ({ email }) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
    if (error) toast.error(error.message); else toast.success("If that account exists, a reset link is on its way.");
  })}><label className="block text-sm font-medium">Email address<Input className="mt-1.5" type="email" autoComplete="email" {...register("email")} /></label>{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}<Button size="lg" className="w-full" disabled={isSubmitting}>Send reset link</Button></form>;
}

export function PasswordUpdateForm({ firstLogin = false }: { firstLogin?: boolean }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });
  return <form className="space-y-4" onSubmit={handleSubmit(async ({ password }) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    let destination = "/dashboard";
    if (firstLogin) {
      const response = await fetch("/api/profile/password-changed", { method: "POST" });
      const body = await response.json();
      if (!response.ok) return toast.error(body.error?.message || "The password was changed, but account setup could not be completed.");
      if (body.data?.role === "ADMIN") destination = "/admin";
    }
    toast.success("Password updated securely.");
    router.replace(destination);
  })}><label className="block text-sm font-medium">New password<Input className="mt-1.5" type="password" autoComplete="new-password" {...register("password")} /></label>{errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}<label className="block text-sm font-medium">Confirm password<Input className="mt-1.5" type="password" autoComplete="new-password" {...register("confirm")} /></label>{errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}<Button size="lg" className="w-full" disabled={isSubmitting}>Update password</Button></form>;
}
