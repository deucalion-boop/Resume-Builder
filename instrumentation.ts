import type { Instrumentation } from "next";
import { validateServerEnvironment } from "@/lib/env";
import { captureMonitoringEvent } from "@/lib/monitoring";

export function register() {
  validateServerEnvironment();
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  await captureMonitoringEvent({
    level: "error",
    event: "next_request_error",
    message: error instanceof Error ? error.message : String(error),
    context: {
      digest,
      method: request.method,
      path: request.path.split("?")[0],
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
    },
  });
};
