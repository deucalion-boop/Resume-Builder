import "server-only";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getAccountRetentionDays() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "platform" }, select: { value: true } });
  const candidate = typeof setting?.value === "object" && setting.value !== null && "accountRetentionDays" in setting.value
    ? Number((setting.value as { accountRetentionDays?: unknown }).accountRetentionDays)
    : 30;
  return Number.isInteger(candidate) && candidate >= 1 && candidate <= 365 ? candidate : 30;
}

export async function revokeSupabaseSessions(userId: string) {
  const revokedAt = new Date();
  await prisma.user.update({ where: { id: userId }, data: { sessionsRevokedAt: revokedAt } });
  try {
    // Supabase has no supported admin "sign out by user id" API. Removing the
    // target user's auth.sessions rows invalidates every refresh token, while
    // sessionsRevokedAt rejects still-live JWTs at the application boundary.
    await prisma.$executeRaw`DELETE FROM auth.sessions WHERE user_id = ${userId}::uuid`;
    return { revokedAt, authSessionsRemoved: true };
  } catch {
    return { revokedAt, authSessionsRemoved: false };
  }
}

export async function removeUserStorage(userId: string) {
  const storage = createSupabaseAdminClient().storage.from("resume-photos");
  let removed = 0;
  let cursor: string | undefined;
  do {
    const { data, error } = await storage.listV2({ prefix: `${userId}/`, limit: 1000, cursor, with_delimiter: false });
    if (error) throw error;
    const paths = data.objects.map(item => item.key ?? item.name).filter(Boolean);
    cursor = data.hasNext ? data.nextCursor : undefined;
    if (!paths.length) continue;
    const result = await storage.remove(paths);
    if (result.error) throw result.error;
    removed += paths.length;
  } while (cursor);
  return removed;
}
