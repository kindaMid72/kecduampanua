import { NextRequest, NextResponse } from "next/server";

// Server-only — kunci API tidak boleh terekspos ke client
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

export async function POST(request: NextRequest) {
  if (!GOOGLE_API_KEY) {
    // Kembalikan null jika key belum dikonfigurasi — jangan block publish
    return NextResponse.json({ translated: null });
  }

  const body = await request.json().catch(() => null);
  if (!body?.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "Teks tidak valid" }, { status: 400 });
  }

  const text: string = body.text;
  const targetLang: string = body.target ?? "en";

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
