"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_COOKIE_NAME } from "./config";

/**
 * Supabase client untuk komponen client-side (browser).
 * Pakai ini di komponen dengan "use client".
 *
 * Hanya untuk yang memang harus dari browser: upload file ke Storage dan
 * pembacaan data admin yang dilindungi RLS. Data publik/pengaduan JANGAN
 * diambil dari sini — lewat Server Component atau Server Action.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { name: SUPABASE_COOKIE_NAME } }
  );
}
