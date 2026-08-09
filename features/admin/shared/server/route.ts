import "server-only";

import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { apiError } from "@/lib/http";
import { AdminRequestError } from "@/features/admin/shared/server/admin-auth";
import { captureMonitoringEvent } from "@/lib/monitoring";

export async function adminRouteError(error: unknown) {
  if (error instanceof z.ZodError) return apiError("VALIDATION_ERROR", "The administrator request contains invalid fields.", 400, error.flatten());
  if (error instanceof AdminRequestError) return apiError(error.code, error.message, error.status);
  if (error instanceof Error && error.message === "NOT_FOUND") return apiError("NOT_FOUND", "The requested record was not found.", 404);
  if (error instanceof Error && error.message === "LAST_ADMIN") return apiError("LAST_ADMIN", "The system must retain at least one active administrator.", 409);
  if (error instanceof Error && error.message === "SELF_PROTECTED") return apiError("SELF_PROTECTED", "You cannot perform this action on your own administrator account.", 409);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return apiError("CONFLICT", "A record with that unique value already exists.", 409);
  await captureMonitoringEvent({
    level: "error",
    event: "admin_route_error",
    message: error instanceof Error ? error.message : "Unknown administrator route failure",
  });
  return apiError("ADMIN_OPERATION_FAILED", "The administrator operation could not be completed.", 500);
}
