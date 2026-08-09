import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new Error("Supabase administrator credentials are not configured.");
  }
  return createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
