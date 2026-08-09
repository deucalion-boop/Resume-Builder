"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

type Template = { id: string; key: string; name: string; description: string | null; enabled: boolean };

export function TemplateManager({ templates }: { templates: Template[] }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const response = await fetch("/api/admin/templates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, enabled }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Could not update the template.");
      return body;
    },
    onError: error => toast.error(error.message),
    onSuccess: () => { toast.success("Template availability updated."); queryClient.invalidateQueries({ queryKey: ["admin-templates"] }); },
  });
  return <Card className="mb-6 p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><LayoutTemplate className="size-4" /></span><div><h2 className="font-semibold">Template availability</h2><p className="text-xs text-muted-foreground">Disabled templates remain readable on existing resumes but cannot be selected for new ones.</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-3">{templates.map(template => <label key={template.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4"><span><span className="block text-sm font-semibold">{template.name}</span><span className="mt-1 block text-xs text-muted-foreground">{template.description}</span></span><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={template.enabled} onChange={event => mutation.mutate({ key: template.key, enabled: event.target.checked })} aria-label={`Enable ${template.name} template`} /></label>)}</div></Card>;
}
