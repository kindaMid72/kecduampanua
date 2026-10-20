/**
 * Origin publik situs (mis. https://duampanua.example), dari NEXT_PUBLIC_SITE_URL.
 *
 * Dipakai untuk sitemap, robots, tautan undangan/reset, dan cek Origin saat logout.
 * Tidak ada fallback ke domain produksi: di produksi, konfigurasi yang kurang
 * dibuat gagal dengan pesan jelas, bukan membuat tautan ke domain yang salah.
 * Di development, dipakai localhost.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;

  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL belum diset.");
    }
    return "http://localhost:3000";
  }

  return new URL(raw).origin;
}
