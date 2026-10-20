import { z } from "zod";

// Kosong = belum diisi (null), bukan 0. Dengan begitu halaman publik bisa membedakan
// "belum diisi" dari angka nol sungguhan.
const angkaOpsional = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : v),
  z.coerce
    .number({ error: "Harus berupa angka" })
    .min(0, "Tidak boleh negatif")
    .nullable()
);

export const dataStatistikSchema = z.object({
  nama_desa_kelurahan: z.string().min(1, "Nama Desa/Kelurahan wajib diisi"),
  jumlah_penduduk: angkaOpsional,
  tahun_data: z.coerce.number().min(1900, "Tahun tidak valid").max(2100, "Tahun tidak valid"),
  
  // Demografi
  penduduk_usia_0_14: angkaOpsional,
  penduduk_usia_15_64: angkaOpsional,
  penduduk_usia_65_ke_atas: angkaOpsional,
  penduduk_laki_laki: angkaOpsional,
  penduduk_perempuan: angkaOpsional,

  // Pendidikan
  jumlah_murid_sd_smp: angkaOpsional,
  jumlah_guru_sd_smp: angkaOpsional,
  penduduk_usia_sekolah: angkaOpsional,
  jumlah_sekolah: angkaOpsional,

  // Kesehatan
  jumlah_rumah_sakit: angkaOpsional,
  jumlah_puskesmas: angkaOpsional,
  jumlah_posyandu: angkaOpsional,
  jumlah_klinik_apotek: angkaOpsional,

  // Geografi
  luas_wilayah_km2: angkaOpsional,
  jarak_ke_ibukota_km: angkaOpsional,

  // Ekonomi & Kelautan
  produksi_panen_ton: angkaOpsional,
  luas_panen_ha: angkaOpsional,
  jumlah_toko_minimarket: angkaOpsional,
  tangkapan_ikan_ton: angkaOpsional,
  jumlah_nelayan: angkaOpsional,
});

export type DataStatistikInput = z.input<typeof dataStatistikSchema>;
