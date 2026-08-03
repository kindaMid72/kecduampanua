import { z } from "zod";

export const edaranDokumenSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  judul_en: z.string().optional(),
  nomor_dokumen: z.string().optional(),
  kategori: z.enum(["regulasi", "panduan", "laporan", "lainnya"]),
  file_url: z.string().min(1, "File wajib diunggah"),
  status: z.enum(["published", "diarsipkan"]),
});

export type EdaranDokumenInput = z.input<typeof edaranDokumenSchema>;
