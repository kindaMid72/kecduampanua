import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-only — kunci API tidak boleh terekspos ke client
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

// VULN-04 fix: Allowlist bahasa yang diizinkan — mencegah request ke bahasa
// sembarang yang berpotensi menyalahgunakan quota Google Translate.
const ALLOWED_TARGET_LANGS = new Set(["en", "id"]);

export async function POST(request: NextRequest) {
  // VULN-04 fix: Hanya admin yang sudah login yang boleh memanggil endpoint ini.
  // Mencegah abuse API key oleh pihak eksternal yang tidak terautentikasi.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GOOGLE_API_KEY) {
    // Kembalikan null jika key belum dikonfigurasi — jangan block publish
    return NextResponse.json({ translated: null });
  }

  const body = await request.json().catch(() => null);
  if (!body?.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "Teks tidak valid" }, { status: 400 });
  }

  // VULN-04 fix: Batasi panjang teks agar tidak bisa dipakai untuk membuang quota
  if (body.text.length > 5000) {
    return NextResponse.json(
      { error: "Teks terlalu panjang (maks 5000 karakter)" },
      { status: 400 }
    );
  }

  const text: string = body.text;
  // VULN-04 fix: Validasi target bahasa — default ke "en" jika tidak dikenal
  const targetLang: string = ALLOWED_TARGET_LANGS.has(body.target)
    ? (body.target as string)
    : "en";

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "id",
          target: targetLang,
          format: "text",
        }),
      }
    );

    if (!res.ok) {
      console.error("Google Translate API error:", res.status);
      return NextResponse.json({ translated: null });
    }

    const data = await res.json();
    const translated =
      data?.data?.translations?.[0]?.translatedText ?? null;

    return NextResponse.json({ translated });
  } catch (err) {
    console.error("Translate fetch error:", err);
    // Jangan crash — kembalikan null, publish tetap jalan
    return NextResponse.json({ translated: null });
  }
}
