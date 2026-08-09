import "server-only";

import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sameOrigin } from "@/lib/http";
import { rateLimit, requestFingerprint } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/env";

export class AdminRequestError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export async function requireAdminRequest(request: Request, mutation = false) {
  if (mutation && !sameOrigin(request)) {
    throw new AdminRequestError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  }
  const user = await getCurrentUser();
  if (!user) throw new AdminRequestError("UNAUTHENTICATED", "Sign in is required.", 401);
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, status: true },
  });
  if (!profile || profile.role !== "ADMIN" || profile.status !== "ACTIVE") {
    throw new AdminRequestError("FORBIDDEN", "Administrator access is required.", 403);
  }
  const fingerprint = requestFingerprint(request);
  const limit = await rateLimit(`admin:${profile.id}:${fingerprint}`, mutation ? 80 : 240, 60_000);
  if (!limit.allowed) {
    await prisma.securityEvent.create({
      data: {
        userId: profile.id, type: "RATE_LIMIT_VIOLATION", severity: "WARNING",
        description: "Administrator API rate limit exceeded.", ipHash: hashRequestValue(fingerprint),
        metadata: { path: new URL(request.url).pathname, mutation },
      },
    });
    throw new AdminRequestError("RATE_LIMITED", "Too many administrator requests.", 429);
  }
  return { user, profile, fingerprint };
}

export function hashRequestValue(value: string) {
  const salt = serverEnv.analyticsHashSalt ?? serverEnv.supabaseServiceRoleKey ?? "local-admin-audit";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function requestAuditContext(request: Request) {
  return {
    ipHash: hashRequestValue(requestFingerprint(request)),
    userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  };
}
