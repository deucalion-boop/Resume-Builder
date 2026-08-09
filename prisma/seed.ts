import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.DEFAULT_ADMIN_PASSWORD;
const name = process.env.DEFAULT_ADMIN_NAME?.trim();

if (!databaseUrl || !supabaseUrl || !serviceKey || !email || !password || !name) {
  throw new Error("Seed requires DATABASE_URL, Supabase server credentials, and all DEFAULT_ADMIN_* variables.");
}
if (password.length < 12) throw new Error("DEFAULT_ADMIN_PASSWORD must contain at least 12 characters.");

const prisma = databaseUrl.startsWith("prisma://") || databaseUrl.startsWith("prisma+postgres://")
  ? new PrismaClient({ accelerateUrl: databaseUrl })
  : new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  let authUser = null;
  let passwordSynchronized = false;
  for (let page = 1; page <= 10 && !authUser; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    authUser = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
    if (data.users.length < 100) break;
  }

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, seeded_admin: true },
    });
    if (error || !data.user) throw error ?? new Error("Supabase did not return the created administrator.");
    authUser = data.user;
    passwordSynchronized = true;
  } else if (process.env.SYNC_DEFAULT_ADMIN_PASSWORD === "true" && authUser.user_metadata.seeded_admin === true) {
    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
      user_metadata: { ...authUser.user_metadata, full_name: name, seeded_admin: true },
    });
    if (error || !data.user) throw error ?? new Error("Supabase did not return the updated administrator.");
    authUser = data.user;
    passwordSynchronized = true;
  }

  const profile = await prisma.user.upsert({
    where: { id: authUser.id },
    create: { id: authUser.id, email: email!, name: name!, role: "ADMIN", mustChangePassword: true, emailVerifiedAt: new Date(), authProvider: "email" },
    update: {
      email: email!,
      name: name!,
      role: "ADMIN",
      status: "ACTIVE",
      deletedAt: null,
      purgeScheduledAt: null,
      emailVerifiedAt: new Date(),
      authProvider: "email",
      ...(passwordSynchronized ? { mustChangePassword: true, sessionsRevokedAt: null } : {}),
    },
  });
  console.log(`Administrator ${email} is ready.${profile.mustChangePassword ? " A password change is required on first login." : ""}`);
}

main().finally(() => prisma.$disconnect());
