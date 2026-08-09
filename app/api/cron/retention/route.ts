import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { removeUserStorage } from "@/lib/account-lifecycle";
import { captureMonitoringEvent } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = serverEnv.cronSecret ?? "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: { code: "UNAUTHORIZED", message: "Invalid cron authorization." } }, { status: 401 });
  const candidates = await prisma.user.findMany({
    where: { status: "DELETED", purgeScheduledAt: { lte: new Date() } },
    orderBy: [{ purgeScheduledAt: "asc" }, { id: "asc" }],
    take: 25,
    select: { id: true },
  });
  const supabase = createSupabaseAdminClient();
  const purged: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  for (const candidate of candidates) {
    try {
      await removeUserStorage(candidate.id);
      const { error } = await supabase.auth.admin.deleteUser(candidate.id);
      if (error && !/not found/i.test(error.message)) throw error;
      await prisma.user.delete({ where: { id: candidate.id } });
      purged.push(candidate.id);
    } catch (error) {
      failed.push({ id: candidate.id, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  await captureMonitoringEvent({
    level: failed.length ? "warning" : "info",
    event: "retention_purge_completed",
    message: `Purged ${purged.length} account(s); ${failed.length} failed.`,
    context: { candidateCount: candidates.length, purgedCount: purged.length, failures: failed },
  });
  return Response.json({ ok: failed.length === 0, processed: candidates.length, purged: purged.length, failed });
}
