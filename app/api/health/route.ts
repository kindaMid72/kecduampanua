import { NextResponse } from "next/server";

// Healthcheck ringan untuk Docker/monitoring. Sengaja TIDAK menyentuh Supabase
// supaya container web tidak ditandai mati hanya karena database sedang sibuk.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
