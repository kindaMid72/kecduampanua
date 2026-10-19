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

  // Hanya relevan setelah migrasi 013 + 014 diterapkan di instance yang dites.
  // Peringatan: kalau 013 BELUM diterapkan, probe check_rate_limit menulis satu baris
  // ke tabel rate_limits (key "e2e-probe"); kalau 014 BELUM diterapkan, probe INSERT
  // pengaduan menyimpan satu baris sampah. Jangan arahkan ke produksi.
  test.describe("anon via PostgREST (setelah migrasi 013 + 014)", () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const headers = { apikey: anonKey ?? "", Authorization: `Bearer ${anonKey ?? ""}` };

    test.skip(!supabaseUrl || !anonKey, "env Supabase tidak tersedia");

    test("anon tidak bisa memanggil check_rate_limit", async ({ request }) => {
      const res = await request.post(`${supabaseUrl}/rest/v1/rpc/check_rate_limit`, {
        headers,
        data: { client_ip: "e2e-probe", max_hits: 1, window_minutes: 1 },
      });
      expect([401, 403, 404]).toContain(res.status());
    });

    test("anon tidak bisa memanggil get_pengaduan_by_tracking langsung (hanya via server)", async ({ request }) => {
      const res = await request.post(`${supabaseUrl}/rest/v1/rpc/get_pengaduan_by_tracking`, {
        headers,
        data: { nomor: "PND-00000000" },
      });
      expect([401, 403, 404]).toContain(res.status());
    });

    test("anon tidak bisa list tabel pengaduan (aturan #10)", async ({ request }) => {
      const res = await request.get(`${supabaseUrl}/rest/v1/pengaduan?select=*`, { headers });
      expect(res.ok()).toBeTruthy();
      expect(await res.json()).toEqual([]);
    });

    test("anon tidak bisa INSERT langsung ke pengaduan (harus lewat Server Action)", async ({ request }) => {
      const res = await request.post(`${supabaseUrl}/rest/v1/pengaduan`, {
        headers: { ...headers, "Content-Type": "application/json" },
        data: {
          nomor_tracking: "PND-E2EPROBE01",
          nama_pelapor: "e2e",
          kontak_pelapor: "e2e",
          deskripsi: "probe e2e, abaikan",
          setuju_data_pribadi: true,
          status: "selesai",
        },
      });
      expect([401, 403]).toContain(res.status());
    });

    test("anon tidak bisa me-list isi bucket uploads", async ({ request }) => {
      const res = await request.post(`${supabaseUrl}/storage/v1/object/list/uploads`, {
        headers: { ...headers, "Content-Type": "application/json" },
        data: { prefix: "", limit: 10 },
      });
      // 200 dengan daftar kosong, atau ditolak — yang tidak boleh: ada isinya
      if (res.ok()) expect(await res.json()).toEqual([]);
    });
  });
});
