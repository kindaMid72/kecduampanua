import { z } from "zod";

export const pengaduanPublikSchema = z.object({
  nama_pelapor: z.string().min(3, "Nama minimal 3 karakter"),
  kontak_pelapor: z.string().min(5, "Kontak (Email/No HP) wajib diisi"),
  kategori: z.string().min(1, "Kategori wajib dipilih"),
  deskripsi: z.string().min(10, "Deskripsi pengaduan minimal 10 karakter"),
  lampiran_url: z.string().optional(),
  setuju_data_pribadi: z.boolean().refine((val) => val === true, {
    message: "Anda harus menyetujui kebijakan privasi",
  }),
  honeypot: z.string().max(0, "Invalid form submission").optional(), // Honeypot field
});

export type PengaduanPublikInput = z.input<typeof pengaduanPublikSchema>;

export const pengaduanAdminSchema = z.object({
  status: z.enum(["baru", "diproses", "selesai"]),
  catatan_tindak_lanjut: z.string().optional(),
});

export type PengaduanAdminInput = z.input<typeof pengaduanAdminSchema>;
