/**
 * Kolom angka di tabel data_statistik (migrasi 001 dan 010).
 * Kolom yang kosong di database bernilai null (lihat docs/DATABASE_SCHEMA.md).
 */
export const KOLOM_ANGKA_STATISTIK = [
  "jumlah_penduduk",
  "penduduk_usia_0_14",
  "penduduk_usia_15_64",
  "penduduk_usia_65_ke_atas",
  "penduduk_laki_laki",
  "penduduk_perempuan",
  "jumlah_murid_sd_smp",
  "jumlah_guru_sd_smp",
  "penduduk_usia_sekolah",
  "jumlah_sekolah",
  "jumlah_rumah_sakit",
  "jumlah_puskesmas",
  "jumlah_posyandu",
  "jumlah_klinik_apotek",
  "luas_wilayah_km2",
  "jarak_ke_ibukota_km",
  "produksi_panen_ton",
  "luas_panen_ha",
  "jumlah_toko_minimarket",
  "tangkapan_ikan_ton",
  "jumlah_nelayan",
] as const;

export type KolomAngkaStatistik = (typeof KOLOM_ANGKA_STATISTIK)[number];

/** Satu baris data_statistik seperti yang dikembalikan query select("*"). */
export type StatistikRow = {
  id: string;
  nama_desa_kelurahan: string;
  tahun_data: number;
} & Partial<Record<KolomAngkaStatistik, number | null>>;

/** Hanya bagian angka dari satu baris (dipakai juga untuk agregat tanpa id). */
export type AngkaStatistik = Partial<Record<KolomAngkaStatistik, number | null>>;
