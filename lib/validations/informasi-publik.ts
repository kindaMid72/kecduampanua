import { z } from "zod";

export const informasiPublikSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter").max(200, "Judul terlalu panjang"),
  judul_en: z.string().max(200).optional().nullable().or(z.literal("")),
  kategori: z.enum(["pengumuman", "kegiatan", "jadwal_rapat"], {
    message: "Pilih kategori yang valid",
  }),
  konten: z.string().min(10, "Isi konten minimal 10 karakter"),
  konten_en: z.string().optional().nullable().or(z.literal("")),
  tanggal_acara: z.string().optional().nullable(),
  lokasi: z.string().max(200).optional().nullable(),
  gambar_cover_url: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["published", "diarsipkan"]).optional().default("published"),
});

export type InformasiPublikInput = z.input<typeof informasiPublikSchema>;
