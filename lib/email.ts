import "server-only";
import { captureMonitoringEvent } from "@/lib/monitoring";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export async function sendTransactionalEmail(input: { to: string; subject: string; heading: string; message: string }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    if (process.env.VERCEL_ENV === "production") {
      await captureMonitoringEvent({ level: "error", event: "email_not_configured", message: `Could not deliver ${input.subject}.` });
    }
    return { sent: false, reason: "not_configured" as const };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: `${input.heading}\n\n${input.message}`,
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;color:#0f2744"><h1 style="font-size:22px">${escapeHtml(input.heading)}</h1><p style="line-height:1.65">${escapeHtml(input.message).replaceAll("\n", "<br>")}</p><hr style="border:0;border-top:1px solid #dbeafe;margin:28px 0"><p style="color:#64748b;font-size:13px">Blue Horizon CV</p></div>`,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      await captureMonitoringEvent({ level: "error", event: "email_delivery_failed", message: `Provider returned ${response.status}.`, context: { subject: input.subject } });
      return { sent: false, reason: "provider_error" as const };
    }
    return { sent: true as const };
  } catch (error) {
    await captureMonitoringEvent({
      level: "error",
      event: "email_delivery_failed",
      message: error instanceof Error ? error.message : "Email provider request failed.",
      context: { subject: input.subject },
    });
    return { sent: false, reason: "network_error" as const };
  }
}
