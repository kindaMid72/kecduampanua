"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { pengaduanPublikSchema } from "@/lib/validations/pengaduan";
import { normalizeClientIp } from "@/lib/client-ip";
import { randomBytes } from "crypto";
import { headers } from "next/headers";

/**
 * VULN-05 fix: Rate limiter persisten berbasis tabel Supabase (RPC check_rate_limit,
 * hanya bisa dipanggil service_role).
 *
 * Default: maksimum 3 request per key per window 10 menit. Key = IP dari header
 * x-real-ip yang DITIMPA reverse proxy (nginx: `proxy_set_header X-Real-IP
 * $remote_addr`). Port aplikasi tidak boleh terbuka langsung ke internet, kalau
 * tidak header ini bisa dipalsukan.
 *
 * failClosed: bila pengecekan gagal (RPC error / service key salah), tolak
 * permintaan. Dipakai untuk cek status (rawan enumerasi nomor); submit tetap
 * fail-open supaya warga tidak terblokir karena gangguan, tapi dicatat di log.
 */
async function checkRateLimit(
  key: string,
  maxHits: number,
  windowMinutes: number,
  failClosed: boolean
): Promise<{ allowed: boolean; unavailable?: boolean }> {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      client_ip: key,
      max_hits: maxHits,
      window_minutes: windowMinutes,
    });

    if (error) throw error;
    return { allowed: data === true };
  } catch (err) {
    console.error("[rate_limit] gagal memeriksa, failClosed =", failClosed, err);
    return failClosed ? { allowed: false, unavailable: true } : { allowed: true };
  }
}

/**
 * Key rate limit dari x-real-ip (diringkas, IPv6 ke /64). Sengaja TIDAK
 * jatuh ke x-forwarded-for: header itu dikendalikan klien.
 * Tanpa x-real-ip: di produksi berarti proxy belum terpasang benar, jadi semua
 * permintaan berbagi satu key "unknown" (ketat) alih-alih lolos tanpa limit;
 * di development rate limit dilewati.
 */
async function getRateLimitKey(): Promise<string | null> {
  const headersList = await headers();
  const ip = normalizeClientIp(headersList.get("x-real-ip"));
  if (ip) return ip;
  return process.env.NODE_ENV === "production" ? "unknown" : null;
}

export type StatusPengaduan = {
  status: string;
  catatan_tindak_lanjut: string | null;
  created_at: string;
  kategori: string | null;
};

// Nomor baru: PND- + 12 hex (48 bit). Nomor lama PND- + 8 hex tetap valid.
const TRACKING_FORMAT = /^PND-(?:[0-9A-F]{8}|[0-9A-F]{12})$/;

/**
 * Cek status pengaduan. Satu-satunya jalan baca data pengaduan untuk publik
 * (aturan #10): RPC get_pengaduan_by_tracking dengan nomor_tracking exact match.
 * RPC itu HANYA bisa dipanggil service_role (migrasi 013), jadi tidak ada jalan
 * lewat REST langsung yang melewati validasi dan rate limit di sini.
 */
export async function cekStatusPengaduanAction(
  nomorTracking: string
): Promise<
  { data: StatusPengaduan } | { error: "invalid" | "notFound" | "rateLimited" | "unavailable" }
> {
  const nomor = String(nomorTracking ?? "").trim().toUpperCase();
  if (!TRACKING_FORMAT.test(nomor)) return { error: "invalid" };

  const key = await getRateLimitKey();
  if (key) {
    // Fail-closed: lebih baik menolak sementara daripada membuka enumerasi nomor.
    const limit = await checkRateLimit(`cek:${key}`, 20, 10, true);
    if (limit.unavailable) return { error: "unavailable" };
    if (!limit.allowed) return { error: "rateLimited" };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.rpc("get_pengaduan_by_tracking", {
      nomor,
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { error: "notFound" };

    return {
      data: {
        status: row.status,
        catatan_tindak_lanjut: row.catatan_tindak_lanjut,
        created_at: row.created_at,
        kategori: row.kategori,
      },
    };
  } catch (err) {
    // Beda dari "tidak ditemukan": warga perlu tahu ini gangguan, bukan nomor salah.
    console.error("[cek_status_pengaduan] gagal:", err);
    return { error: "unavailable" };
  }
}

// Nomor tracking acak. Dipakai juga untuk balasan palsu ke bot agar tidak selalu sama.
const generateTrackingId = () =>
  `PND-${randomBytes(6).toString("hex").toUpperCase()}`;

// Batas total seluruh pengirim, di luar batas per IP. Melindungi dari bot yang
// berganti IP. Angka ini teknis (bukan fakta layanan) dan bisa disesuaikan.
const BATAS_GLOBAL_PENGADUAN_PER_JAM = 50;

export async function submitPengaduanAction(formData: FormData) {
  const key = await getRateLimitKey();

  if (key) {
    const rateLimitResult = await checkRateLimit(key, 3, 10, false);
    if (!rateLimitResult.allowed) {
      return {
        error:
          "Anda mengirim terlalu banyak pengaduan. Silakan tunggu 10 menit.",
      };
    }
  }

  const globalResult = await checkRateLimit(
    "submit:global",
    BATAS_GLOBAL_PENGADUAN_PER_JAM,
    60,
    false
  );
  if (!globalResult.allowed) {
    return {
      error: "Saat ini terlalu banyak pengaduan masuk. Silakan coba lagi nanti.",
    };
  }

  const honeypot = formData.get("honeypot");

  // Honeypot dicek sebelum validasi: bot yang mengisi field tersembunyi
  // menerima balasan sukses palsu, tidak pernah tahu bahwa dia tertangkap.
  if (typeof honeypot === "string" && honeypot !== "") {
    return { success: true, trackingId: generateTrackingId() };
  }

  const raw = {
    nama_pelapor: formData.get("nama_pelapor"),
    kontak_pelapor: formData.get("kontak_pelapor"),
    kategori: formData.get("kategori"),
    deskripsi: formData.get("deskripsi"),
    setuju_data_pribadi: formData.get("setuju_data_pribadi") === "true",
  };

  const parsed = pengaduanPublikSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Insert dari server dengan service role: anon TIDAK punya hak INSERT langsung
  // ke tabel pengaduan (migrasi 014), supaya kolom staf (status, catatan,
  // diarsipkan_pada, ...) dan nomor_tracking tidak bisa diisi pihak luar. Hanya
  // kolom di bawah ini yang diteruskan, semuanya sudah divalidasi zod.
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[pengaduan] admin client tidak tersedia:", err);
    return { error: "Gagal mengirim pengaduan. Silakan coba lagi nanti." };
  }

  // Tracking number acak (mis. PND-8A7B6C5D9E0F). Keunikan dijamin constraint
  // UNIQUE di database, bukan SELECT dulu. Kalau bentrok (kode 23505), ulangi
  // dengan nomor baru.
  for (let attempt = 0; attempt < 5; attempt++) {
    const trackingId = generateTrackingId();

    const { error } = await supabase.from("pengaduan").insert({
      nomor_tracking: trackingId,
      nama_pelapor: parsed.data.nama_pelapor,
      kontak_pelapor: parsed.data.kontak_pelapor,
      kategori: parsed.data.kategori,
      deskripsi: parsed.data.deskripsi,
      setuju_data_pribadi: parsed.data.setuju_data_pribadi,
      status: "baru",
    });

    if (!error) return { success: true, trackingId };

    if (error.code !== "23505") {
      // Jangan log objek error utuh: pesan Postgres bisa memuat "Failing row contains (...)"
      // yang berisi nama, kontak, dan isi pengaduan (data pribadi, UU PDP).
      console.error("[pengaduan] insert gagal:", error.code, error.message);
      return { error: "Gagal mengirim pengaduan. Silakan coba lagi nanti." };
    }
  }

  return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
}
