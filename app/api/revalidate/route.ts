import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "crypto";

// Bandingkan secret dengan waktu konstan agar tidak bisa ditebak lewat timing.
function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    // Secret khusus endpoint ini (REVALIDATE_SECRET). Jangan pakai service role
    // key sebagai secret webhook: key itu bypass RLS dan tidak boleh dikirim lewat jaringan.
    // Secret kosong = endpoint dimatikan. Balas 401 generik, jangan membocorkan
    // bahwa konfigurasi server belum lengkap; detailnya cukup di log server.
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
      console.error("REVALIDATE_SECRET belum diset: /api/revalidate dinonaktifkan.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!secretMatches(request.headers.get("Authorization"), secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();

    if (type === "UPDATE" || type === "INSERT" || type === "DELETE") {
       // Untuk sekarang, karena masih MVP, revalidate semua path publik dan admin yang berkaitan
       revalidatePath("/", "layout");
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error("Error di /api/revalidate:", err);
    return NextResponse.json({ error: "Error revalidating" }, { status: 500 });
  }
}
