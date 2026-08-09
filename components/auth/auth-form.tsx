"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});
type FormValues = z.infer<typeof schema>;

export function AuthForm({ mode, registrationEnabled = true, enabledOAuthProviders = ["google", "github"] }: { mode: "login" | "register"; registrationEnabled?: boolean; enabledOAuthProviders?: ("google" | "github")[] }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function submit(values: FormValues) {
    try {
      const supabase = createSupabaseBrowserClient();
      const result = mode === "register"
        ? await supabase.auth.signUp({ email: values.email, password: values.password, options: { data: { full_name: values.name }, emailRedirectTo: `${location.origin}/auth/callback` } })
        : await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
      if (result.error) throw result.error;
      if (mode === "register" && !result.data.session) {
        toast.success("Check your inbox to confirm your account.");
      } else {
        toast.success(mode === "register" ? "Welcome to Resumly!" : "Welcome back!");
        const profileResponse = await fetch("/api/profile", { cache: "no-store" });
        const profileBody = profileResponse.ok ? await profileResponse.json() : null;
        const destination = profileBody?.data?.mustChangePassword ? "/change-password" : profileBody?.data?.role === "ADMIN" ? "/admin" : "/dashboard";
        router.replace(destination);
      }
    } catch (error) {
      if (mode === "login") {
        void fetch("/api/security/auth-event", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "FAILED_LOGIN", email: values.email }),
        });
      }
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  async function oauth(provider: "google" | "github") {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${location.origin}/auth/callback?next=/dashboard` },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start sign in.");
    }
  }

  return (
    <div>
      <div className={enabledOAuthProviders.length === 1 ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
        {enabledOAuthProviders.includes("google") && <Button type="button" variant="outline" onClick={() => oauth("google")}><span className="text-base font-bold">G</span> Google</Button>}
        {enabledOAuthProviders.includes("github") && <Button type="button" variant="outline" onClick={() => oauth("github")}><span className="font-mono text-xs font-bold">&lt;/&gt;</span> GitHub</Button>}
      </div>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with email<span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {mode === "register" && (
          <label className="block text-sm font-medium">Full name
            <Input className="mt-1.5" placeholder="Your name" autoComplete="name" {...register("name")} />
          </label>
        )}
        <label className="block text-sm font-medium">Email address
          <div className="relative mt-1.5"><Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" /><Input className="pl-10" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} /></div>
          {errors.email && <span className="mt-1 text-xs text-red-500">{errors.email.message}</span>}
        </label>
        <label className="block text-sm font-medium">
          <span className="flex justify-between">Password{mode === "login" && <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>}</span>
          <Input className="mt-1.5" type="password" placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} />
          {errors.password && <span className="mt-1 text-xs text-red-500">{errors.password.message}</span>}
        </label>
        <Button className="w-full" size="lg" disabled={isSubmitting || (mode === "register" && !registrationEnabled)}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Create my account"}
        </Button>
      </form>
      {mode === "register" && !registrationEnabled && <p role="alert" className="mt-3 rounded-xl bg-amber-500/10 p-3 text-center text-xs text-amber-700 dark:text-amber-300">New registrations are temporarily disabled by an administrator.</p>}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? "New to Resumly? " : "Already have an account? "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-primary hover:underline">{mode === "login" ? "Create an account" : "Sign in"}</Link>
      </p>
    </div>
  );
}
