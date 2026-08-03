import { z } from "zod";

export const layananSchema = z.object({
  nama_layanan: z.string().min(3, "Nama layanan minimal 3 karakter"),
  nama_layanan_en: z.string().optional().nullable().or(z.literal("")),
  deskripsi: z.string().optional().nullable().or(z.literal("")),
  deskripsi_en: z.string().optional().nullable().or(z.literal("")),
  syarat_dokumen: z
    .array(z.string().min(1))
    .optional()
    .default([]),
  alur_proses: z.string().optional().nullable().or(z.literal("")),
  alur_proses_en: z.string().optional().nullable().or(z.literal("")),
  estimasi_waktu: z.string().max(100).optional().nullable().or(z.literal("")),
  link_formulir_url: z
    .string()
    .url("Format URL tidak valid")
    .optional()
    .nullable()
    .or(z.literal("")),
  dokumen_standar_pelayanan_url: z
    .string()
    .url("Format URL tidak valid")
    .optional()
    .nullable()
    .or(z.literal("")),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
  urutan: z.number().int().min(0).default(0),
});

export type LayananInput = z.input<typeof layananSchema>;

