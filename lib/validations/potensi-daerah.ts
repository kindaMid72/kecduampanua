import { z } from "zod";

export const potensiDaerahSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  judul_en: z.string().optional(),
  kategori: z.enum(["ekonomi", "wisata", "pengolahan"]),
  deskripsi: z.string().min(10, "Deskripsi minimal 10 karakter"),
  deskripsi_en: z.string().optional(),
  lokasi: z.string().optional(),
  gambar_url: z.string().optional(),
  video_url: z.string().optional(),
  status: z.enum(["published", "diarsipkan"]),
  urutan: z.coerce.number().int().default(0),
});

export type PotensiDaerahInput = z.input<typeof potensiDaerahSchema>;

