/**
 * Konfigurasi bersama untuk semua Supabase client (browser, server, middleware).
 *
 * Self-hosted di VPS yang sama: browser mengakses Supabase lewat URL publik
 * (https://api.domain.id), sedangkan kode server (SSR, middleware, server action)
 * boleh memakai URL internal Docker (mis. http://kong:8000) lewat
 * SUPABASE_INTERNAL_URL — lebih cepat dan tidak memutar lewat internet.
 */

/**
 * Nama cookie sesi dibuat tetap. Tanpa ini, @supabase/ssr menurunkan nama
 * cookie dari hostname URL Supabase, sehingga browser (api.domain.id) dan
 * server (kong) akan menulis/membaca cookie dengan nama berbeda dan sesi
 * login tidak pernah terbaca.
 */
export const SUPABASE_COOKIE_NAME = "sb-duampanua-auth";

/** URL Supabase untuk kode yang berjalan di server. */
export function getServerSupabaseUrl(): string {
  return (
    process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  );
}
