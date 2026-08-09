import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    const user = data.user;
    if (!user?.email) return null;
    const existing = await prisma.user.findUnique({ where: { id: user.id } });
    const provider = user.app_metadata.provider === "google" || user.app_metadata.provider === "github" ? user.app_metadata.provider : "email";
    const lastLoginAt = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
    const emailVerifiedAt = user.email_confirmed_at ? new Date(user.email_confirmed_at) : null;
    const name = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name.slice(0, 80) : null;
    const profile = existing ?? await prisma.user.create({
      data: { id: user.id, email: user.email, name, authProvider: provider, lastLoginAt, emailVerifiedAt, lastActiveAt: new Date() },
    });
    if (profile.status !== "ACTIVE") return null;
    if (profile.sessionsRevokedAt && (!lastLoginAt || lastLoginAt <= profile.sessionsRevokedAt)) return null;
    const staleActivity = !profile.lastActiveAt || Date.now() - profile.lastActiveAt.getTime() > 5 * 60_000;
    if (staleActivity || profile.email !== user.email || profile.authProvider !== provider || profile.emailVerifiedAt?.getTime() !== emailVerifiedAt?.getTime()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: user.email, name: name ?? undefined, authProvider: provider, lastLoginAt, emailVerifiedAt, ...(staleActivity ? { lastActiveAt: new Date() } : {}) },
      });
    }
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireUserProfile() {
  const user = await requireUser();
  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  if (!profile) throw new Error("Authenticated user profile is missing.");
  return { user, profile };
}

export async function requireAdmin() {
  const context = await requireUserProfile();
  if (context.profile.role !== "ADMIN") redirect("/dashboard");
  return context;
}
