import { z } from "zod";

export const pengaduanPublikSchema = z.object({
  nama_pelapor: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  kontak_pelapor: z.string().min(5, "Kontak (Email/No HP) wajib diisi").max(100, "Kontak maksimal 100 karakter"),
  kategori: z.string().min(1, "Kategori wajib dipilih").max(50, "Kategori tidak valid"),
  deskripsi: z.string().min(10, "Deskripsi pengaduan minimal 10 karakter").max(5000, "Deskripsi maksimal 5000 karakter"),
  setuju_data_pribadi: z.boolean().refine((val) => val === true, {
    message: "Anda harus menyetujui kebijakan privasi",
  }),
  // Honeypot: diisi bot, bukan manusia. Dicek di action sebelum validasi lain
  // (jangan diberi max(0) di sini: pesan error akan memberi tahu bot bahwa dia tertangkap).
  honeypot: z.string().optional(),
});

export type PengaduanPublikInput = z.input<typeof pengaduanPublikSchema>;

export const pengaduanAdminSchema = z.object({
  status: z.enum(["baru", "diproses", "selesai"]),
  catatan_tindak_lanjut: z.string().optional(),
});

export type PengaduanAdminInput = z.input<typeof pengaduanAdminSchema>;
