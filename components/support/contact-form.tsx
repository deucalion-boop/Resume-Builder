"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  async function submit(formData: FormData) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Could not submit your request.");
      toast.success(`Support request ${body.ticketId} received.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }
  return <form action={submit} className="space-y-4">
    <label className="block text-sm font-medium">Email<Input required type="email" name="email" className="mt-1.5" /></label>
    <label className="block text-sm font-medium">Subject<Input required minLength={4} maxLength={160} name="subject" className="mt-1.5" /></label>
    <label className="block text-sm font-medium">Request type<select name="type" className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3"><option value="CONTACT">General contact</option><option value="FEEDBACK">Feedback</option><option value="ACCOUNT_RECOVERY">Account recovery</option><option value="TECHNICAL_ERROR">Technical error</option><option value="ABUSE_REPORT">Abuse report</option></select></label>
    <label className="block text-sm font-medium">Message<Textarea required minLength={10} maxLength={5000} name="message" rows={6} className="mt-1.5" /></label>
    <Button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send request"}</Button>
  </form>;
}
