import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Admin client — HANYA untuk server-side operations yang butuh bypass RLS:
 * - Invite user (generateLink)
 * - Ban/unban user
 * - Seed data awal
 *
 * JANGAN PERNAH import file ini di client component atau expose ke browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diset di environment variables."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
