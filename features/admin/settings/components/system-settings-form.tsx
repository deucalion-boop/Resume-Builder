"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { settingsSchema } from "@/features/admin/shared/schemas";

type Values = z.infer<typeof settingsSchema>;
const sections = ["personal", "summary", "experience", "education", "skills", "projects", "certifications", "languages", "awards", "interests", "references"];
const providers = ["google", "github"] as const;

export function SystemSettingsForm({ initialValues }: { initialValues: Values }) {
  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<Values>({ resolver: zodResolver(settingsSchema), defaultValues: initialValues });
  const [enabledSections, enabledProviders, allowedTypes, registrationEnabled, maintenanceMode, availableFonts, colorThemes] = useWatch({
    control,
    name: ["enabledSections", "enabledOAuthProviders", "allowedImageTypes", "registrationEnabled", "maintenanceMode", "availableFonts", "colorThemes"],
  });
  async function save(values: Values) {
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message ?? "Could not save platform settings.");
    toast.success("Platform settings saved.");
  }
  return <form onSubmit={handleSubmit(values => save(values).catch(error => toast.error(error.message)))} className="space-y-6" noValidate>
    <Card className="p-5"><h2 className="font-semibold">Branding and public site</h2><p className="mt-1 text-xs text-muted-foreground">URLs must use HTTPS in production. Text values are escaped when rendered.</p><div className="mt-5 grid gap-4 md:grid-cols-2">
      <Field label="Application name" error={errors.applicationName?.message}><Input {...register("applicationName")} /></Field>
      <Field label="Support email" error={errors.supportEmail?.message}><Input type="email" {...register("supportEmail")} /></Field>
      <Field label="Logo URL" error={errors.logoUrl?.message}><Input type="url" placeholder="https://…" {...register("logoUrl")} /></Field>
      <Field label="Favicon URL" error={errors.faviconUrl?.message}><Input type="url" placeholder="https://…" {...register("faviconUrl")} /></Field>
      <Field label="SEO title" error={errors.seoTitle?.message}><Input {...register("seoTitle")} /></Field>
      <Field label="SEO description" error={errors.seoDescription?.message}><Input {...register("seoDescription")} /></Field>
      <Field label="Privacy policy URL" error={errors.privacyPolicyUrl?.message}><Input type="url" {...register("privacyPolicyUrl")} /></Field>
      <Field label="Terms of service URL" error={errors.termsUrl?.message}><Input type="url" {...register("termsUrl")} /></Field>
    </div></Card>
    <Card className="p-5"><h2 className="font-semibold">Access and operations</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
      <Toggle label="Allow new registrations" description="Controls email and OAuth account creation." checked={registrationEnabled} onChange={value => setValue("registrationEnabled", value, { shouldDirty: true })} />
      <Toggle label="Maintenance mode" description="Blocks regular dashboards while administrators retain access." checked={maintenanceMode} onChange={value => setValue("maintenanceMode", value, { shouldDirty: true })} warning />
    </div><fieldset className="mt-5"><legend className="text-sm font-semibold">OAuth providers</legend><div className="mt-2 flex gap-3">{providers.map(provider => <Check key={provider} label={provider} checked={enabledProviders.includes(provider)} onChange={checked => setValue("enabledOAuthProviders", checked ? [...enabledProviders, provider] : enabledProviders.filter(item => item !== provider), { shouldDirty: true })} />)}</div></fieldset><Field label="System announcement" className="mt-5" error={errors.announcement?.message}><Textarea rows={3} placeholder="Optional message shown across the platform…" {...register("announcement")} /></Field></Card>
    <Card className="p-5"><h2 className="font-semibold">Uploads and presentation</h2><div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="Profile image limit (MB)" error={errors.uploadLimitMb?.message}><Input type="number" min={1} max={20} {...register("uploadLimitMb", { valueAsNumber: true })} /></Field><Field label="Deleted account retention (days)" error={errors.accountRetentionDays?.message}><Input type="number" min={1} max={365} {...register("accountRetentionDays", { valueAsNumber: true })} /></Field><div><p className="text-sm font-medium">Allowed image types</p><div className="mt-2 flex flex-wrap gap-2">{(["image/jpeg", "image/png", "image/webp"] as const).map(type => <Check key={type} label={type.replace("image/", "").toUpperCase()} checked={allowedTypes.includes(type)} onChange={checked => setValue("allowedImageTypes", checked ? [...allowedTypes, type] : allowedTypes.filter(item => item !== type), { shouldDirty: true })} />)}</div></div><Field label="Available fonts (comma separated)" error={errors.availableFonts?.message}><Input value={availableFonts.join(", ")} onChange={event => setValue("availableFonts", event.target.value.split(",").map(value => value.trim()).filter(Boolean), { shouldDirty: true })} /></Field><Field label="Accent colors (hex, comma separated)" error={errors.colorThemes?.message}><Input value={colorThemes.join(", ")} onChange={event => setValue("colorThemes", event.target.value.split(",").map(value => value.trim()).filter(Boolean), { shouldDirty: true })} /></Field></div></Card>
    <Card className="p-5"><h2 className="font-semibold">Resume sections</h2><p className="mt-1 text-xs text-muted-foreground">Choose which sections are available to editors.</p><div className="mt-4 flex flex-wrap gap-2">{sections.map(section => <Check key={section} label={section.replaceAll("_", " ")} checked={enabledSections.includes(section)} onChange={checked => setValue("enabledSections", checked ? [...enabledSections, section] : enabledSections.filter(item => item !== section), { shouldDirty: true })} />)}</div>{errors.enabledSections && <p className="mt-2 text-xs text-rose-600">{errors.enabledSections.message}</p>}</Card>
    <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur"><Link href="/admin/account" className="text-xs font-semibold text-primary hover:underline">Manage my administrator account</Link><Button type="submit" disabled={isSubmitting || !isDirty}><Save className="size-4" />{isSubmitting ? "Saving…" : "Save settings"}</Button></div>
  </form>;
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="text-sm font-medium">{label}</span><div className="mt-1.5">{children}</div>{error && <span role="alert" className="mt-1 block text-xs text-rose-600">{error}</span>}</label>;
}
function Toggle({ label, description, checked, onChange, warning }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void; warning?: boolean }) {
  return <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${warning && checked ? "border-amber-500/30 bg-amber-500/5" : "border-border"}`}><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="size-4 accent-[var(--primary)]" /></label>;
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium capitalize"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="size-3.5 accent-[var(--primary)]" />{label}</label>;
}
