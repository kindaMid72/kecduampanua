import { z } from "zod";

export const beritaSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter").max(200, "Judul terlalu panjang"),
  judul_en: z.string().max(200).optional().nullable().or(z.literal("")),
  kategori: z.string().max(100, "Kategori terlalu panjang").optional().nullable().or(z.literal("")),
  konten: z.string().min(10, "Isi konten minimal 10 karakter"),
  konten_en: z.string().optional().nullable().or(z.literal("")),
  gambar_cover_url: z
    .string()
    .url("URL gambar tidak valid")
    .min(1, "Gambar cover wajib diisi"),
  status: z.enum(["published", "diarsipkan"]).optional().default("published"),
});

export type BeritaInput = z.input<typeof beritaSchema>;
