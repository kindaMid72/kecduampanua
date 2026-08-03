import { z } from "zod";

export const dataStatistikSchema = z.object({
  nama_desa_kelurahan: z.string().min(1, "Nama Desa/Kelurahan wajib diisi"),
  jumlah_penduduk: z.coerce.number().min(0, "Jumlah penduduk tidak boleh negatif").optional(),
  tahun_data: z.coerce.number().min(1900, "Tahun tidak valid").max(2100, "Tahun tidak valid"),
});

export type DataStatistikInput = z.input<typeof dataStatistikSchema>;
