"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReportStatusAction({ resumeId, reportId, currentStatus }: { resumeId: string; reportId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  async function update(next: "REVIEWING" | "RESOLVED" | "DISMISSED") {
    setSaving(true);
    const previous = status; setStatus(next);
    try {
      const response = await fetch(`/api/admin/resumes/${resumeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_report_status", reportId, status: next, reason: `Administrator marked the report ${next.toLowerCase()}.` }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Could not update report.");
      toast.success(body.summary);
    } catch (error) {
      setStatus(previous); toast.error(error instanceof Error ? error.message : "Could not update report.");
    } finally {
      setSaving(false);
    }
  }
  return <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={saving || status === "REVIEWING"} onClick={() => update("REVIEWING")}>Review</Button><Button size="sm" variant="outline" disabled={saving || status === "RESOLVED"} onClick={() => update("RESOLVED")}>Resolve</Button><Button size="sm" variant="ghost" disabled={saving || status === "DISMISSED"} onClick={() => update("DISMISSED")}>Dismiss</Button></div>;
}
