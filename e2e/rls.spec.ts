import { expect, test } from "@playwright/test";

test.describe("Row Level Security (RLS) Tests", () => {
  test("anon tidak bisa list informasi_publik diarsipkan", async ({ request }) => {
    // Gunakan REST API Supabase untuk mensimulasikan pemanggilan anon
    // Request ini akan dikirim tanpa Authorization header, yang berarti berjalan sebagai anon role di PostgreSQL.
    
    // URL REST API default Supabase lokal (berdasarkan pengaturan Supabase standar)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    // Lewati jika env tidak tersedia
    if (!supabaseUrl || !supabaseKey) return;

    const response = await request.get(`${supabaseUrl}/rest/v1/informasi_publik?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Pastikan tidak ada data yang statusnya selain 'published'
    const hasArchived = data.some((item: { status: string }) => item.status !== 'published');
    expect(hasArchived).toBe(false);
  });
});
