import "server-only";
import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));
const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  ANALYTICS_HASH_SALT: z.string().min(32),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(20),
  CRON_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(20),
  EMAIL_FROM: z.string().refine(value =>
    z.email().safeParse(value).success || /^[^<>\r\n]{1,80}<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>$/.test(value),
  "Use an email address or a display name followed by <email@example.com>."),
  MONITORING_INGEST_URL: optionalUrl,
  MONITORING_INGEST_TOKEN: z.string().optional(),
  SECURITY_ALERT_WEBHOOK_URL: optionalUrl,
});

export const serverEnv = {
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  analyticsHashSalt: process.env.ANALYTICS_HASH_SALT,
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL,
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD,
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME,
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  cronSecret: process.env.CRON_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
  monitoringIngestUrl: process.env.MONITORING_INGEST_URL,
  monitoringIngestToken: process.env.MONITORING_INGEST_TOKEN,
  securityAlertWebhookUrl: process.env.SECURITY_ALERT_WEBHOOK_URL,
};

/**
 * Vercel production instances fail before accepting traffic when security
 * credentials are missing. CI/build previews remain able to compile with
 * placeholders; set STRICT_ENV_VALIDATION=true to exercise the same gate.
 */
export function validateServerEnvironment() {
  const strict = process.env.VERCEL_ENV === "production" || process.env.STRICT_ENV_VALIDATION === "true";
  if (!strict) return;
  const parsed = serverEnvironmentSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map(issue => issue.path.join(".")).join(", ");
    throw new Error(`Invalid production environment configuration: ${fields}`);
  }
  const exposedSecrets = ["SUPABASE_SERVICE_ROLE_KEY", "UPSTASH_REDIS_REST_TOKEN", "CRON_SECRET", "ANALYTICS_HASH_SALT"]
    .filter(name => process.env[`NEXT_PUBLIC_${name}`]);
  if (exposedSecrets.length) throw new Error(`Server secrets must not use NEXT_PUBLIC_: ${exposedSecrets.join(", ")}`);
}

export function assertSupabaseEnv() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return { url: serverEnv.supabaseUrl, anonKey: serverEnv.supabaseAnonKey };
}
