"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function ReportResume({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Inappropriate content");
  const [details, setDetails] = useState("");
  async function submit() {
    const response = await fetch(`/api/public/resumes/${slug}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details }) });
    const body = await response.json();
    if (!response.ok) return toast.error(body.error?.message ?? "The report could not be submitted.");
    toast.success("Report submitted for administrator review."); setOpen(false);
  }
  return <div className="relative"><Button variant="ghost" size="sm" onClick={() => setOpen(current => !current)}><Flag className="size-3.5" />Report</Button>{open && <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl"><label className="block text-xs font-semibold">Reason<select className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm" value={reason} onChange={event => setReason(event.target.value)}><option>Inappropriate content</option><option>Impersonation</option><option>Spam or fraud</option><option>Privacy concern</option><option>Other</option></select></label><label className="mt-3 block text-xs font-semibold">Details<Textarea className="mt-1.5" value={details} onChange={event => setDetails(event.target.value)} maxLength={1000} /></label><Button size="sm" className="mt-3 w-full" onClick={submit}>Submit report</Button></div>}</div>;
}
