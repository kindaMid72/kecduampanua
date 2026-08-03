import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Kata sandi wajib diisi")
    .min(8, "Kata sandi minimal 8 karakter"),
});

export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter")
      .regex(/[A-Z]/, "Harus mengandung setidaknya 1 huruf kapital")
      .regex(/[0-9]/, "Harus mengandung setidaknya 1 angka"),
    konfirmasi: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password === data.konfirmasi, {
    message: "Kata sandi tidak cocok",
    path: ["konfirmasi"],
  });

export type LoginInput = z.input<typeof loginSchema>;
export type SetPasswordInput = z.input<typeof setPasswordSchema>;

export const editPenggunaSchema = z.object({
  nama_lengkap: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  role: z.enum(["super_account", "staf"], {
    message: "Peran pengguna tidak valid",
  }),
});

export type EditPenggunaInput = z.input<typeof editPenggunaSchema>;

export const updateProfilMandiriSchema = z.object({
  nama_lengkap: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi")
    .max(100, "Nama lengkap maksimal 100 karakter"),
});

export type UpdateProfilMandiriInput = z.input<typeof updateProfilMandiriSchema>;

export const gantiKataSandiSchema = z
  .object({
    kata_sandi_lama: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    kata_sandi_baru: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter")
      .regex(/[A-Z]/, "Kata sandi baru harus mengandung setidaknya 1 huruf kapital")
      .regex(/[0-9]/, "Kata sandi baru harus mengandung setidaknya 1 angka"),
    konfirmasi_kata_sandi_baru: z
      .string()
      .min(1, "Konfirmasi kata sandi baru wajib diisi"),
  })
  .refine((data) => data.kata_sandi_baru === data.konfirmasi_kata_sandi_baru, {
    message: "Konfirmasi kata sandi baru tidak cocok",
    path: ["konfirmasi_kata_sandi_baru"],
  });

export type GantiKataSandiInput = z.input<typeof gantiKataSandiSchema>;
