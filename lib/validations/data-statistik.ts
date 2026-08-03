import { z } from "zod";

export const dataStatistikSchema = z.object({
  nama_desa_kelurahan: z.string().min(1, "Nama Desa/Kelurahan wajib diisi"),
  jumlah_penduduk: z.coerce.number().min(0, "Jumlah penduduk tidak boleh negatif").optional(),
  tahun_data: z.coerce.number().min(1900, "Tahun tidak valid").max(2100, "Tahun tidak valid"),
  
  // Demografi
  penduduk_usia_0_14: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  penduduk_usia_15_64: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  penduduk_usia_65_ke_atas: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  penduduk_laki_laki: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  penduduk_perempuan: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),

  // Pendidikan
  jumlah_murid_sd_smp: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  jumlah_guru_sd_smp: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  penduduk_usia_sekolah: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  jumlah_sekolah: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),

  // Kesehatan
  jumlah_rumah_sakit: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  jumlah_puskesmas: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  jumlah_posyandu: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  jumlah_klinik_apotek: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),

  // Geografi
  luas_wilayah_km2: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  jarak_ke_ibukota_km: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),

  // Ekonomi & Kelautan
  produksi_panen_ton: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  luas_panen_ha: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  jumlah_toko_minimarket: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  tangkapan_ikan_ton: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
  jumlah_nelayan: z.coerce.number().min(0, "Tidak boleh negatif").optional().default(0),
});

export type DataStatistikInput = z.input<typeof dataStatistikSchema>;
