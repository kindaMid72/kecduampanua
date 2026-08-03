import { z } from "zod";

export const edaranDokumenSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  nomor_surat: z.string().optional(),
  kategori: z.string().optional(),
  deskripsi: z.string().min(5, "Deskripsi minimal 5 karakter"),
  file_url: z.string().min(1, "File wajib diunggah"),
  tanggal_terbit: z.string().min(1, "Tanggal terbit wajib diisi"),
});

export type EdaranDokumenInput = z.input<typeof edaranDokumenSchema>;
