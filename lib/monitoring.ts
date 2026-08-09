import "server-only";

type MonitoringEvent = {
  level: "info" | "warning" | "error" | "critical";
  event: string;
  message: string;
  context?: Record<string, unknown>;
};

function sanitized(event: MonitoringEvent) {
  return {
    ...event,
    timestamp: new Date().toISOString(),
    service: "resume-builder",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.npm_package_version,
  };
}

export async function captureMonitoringEvent(event: MonitoringEvent) {
  const payload = sanitized(event);
  const write = event.level === "error" || event.level === "critical" ? console.error : event.level === "warning" ? console.warn : console.info;
  write(JSON.stringify(payload));
  const url = process.env.MONITORING_INGEST_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.MONITORING_INGEST_TOKEN ? { authorization: `Bearer ${process.env.MONITORING_INGEST_TOKEN}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3_000),
    });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "monitoring_delivery_failed", message: error instanceof Error ? error.message : "Unknown error" }));
  }
}

export async function sendSecurityAlert(event: MonitoringEvent) {
  await captureMonitoringEvent(event);
  if (event.level !== "critical" || !process.env.SECURITY_ALERT_WEBHOOK_URL) return;
  try {
    await fetch(process.env.SECURITY_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sanitized(event)),
      signal: AbortSignal.timeout(3_000),
    });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "security_alert_delivery_failed", message: error instanceof Error ? error.message : "Unknown error" }));
  }
}
