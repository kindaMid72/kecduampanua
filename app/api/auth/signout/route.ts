// Route handler untuk logout
// Menggunakan NextResponse.redirect (bukan next/navigation redirect)
// agar cookie yang di-set oleh supabase.auth.signOut() benar-benar
// ikut terbawa dalam response headers sebelum redirect terjadi.
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // VULN-03 fix: Validasi Origin header untuk mencegah CSRF.
  // Request dari domain lain (misal halaman attacker) akan ditolak 403.
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const allowedOrigin = new URL(siteUrl).origin;

  if (origin && origin !== allowedOrigin) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  // Bangun URL dari domain publik, bukan request.url: di belakang reverse proxy,
  // request.url bisa berisi host internal container (mis. 0.0.0.0:3000).
  const url = new URL("/admin/login", allowedOrigin);
  return NextResponse.redirect(url, { status: 303 });
}
