"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client untuk komponen client-side (browser).
 * Pakai ini di komponen dengan "use client".
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
