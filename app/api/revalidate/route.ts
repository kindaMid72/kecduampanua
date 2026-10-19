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
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "REVALIDATE_SECRET belum diset" }, { status: 500 });
    }

    if (!secretMatches(request.headers.get("Authorization"), secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, record } = await request.json();

    if (type === "UPDATE" || type === "INSERT" || type === "DELETE") {
       // Untuk sekarang, karena masih MVP, revalidate semua path publik dan admin yang berkaitan
       revalidatePath("/", "layout");
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: "Error revalidating" }, { status: 500 });
  }
}
