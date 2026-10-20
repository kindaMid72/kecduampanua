import { z } from "zod";

// Input dari FormData berupa string. Kosong = null (tidak diisi), bukan string kosong.
const teks = (maks: number) =>
  z
    .string()
    .trim()
    .max(maks, `Maksimal ${maks} karakter`)
    .optional()
    .transform((v) => (v ? v : null));

const email = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.email("Format email tidak valid").max(120, "Email maksimal 120 karakter").nullable());

// parseFloat/parseInt membiarkan NaN lolos dan NaN berubah jadi null saat dikirim.
// Di sini angka rusak ditolak dengan pesan, dan rentang nilai dicek.
const angka = (label: string, min: number, maks: number, bulat = false) => {
  let skema = z
    .number({ error: `${label} harus berupa angka` })
    .min(min, `${label} minimal ${min}`)
    .max(maks, `${label} maksimal ${maks}`);
  if (bulat) skema = skema.int(`${label} harus bilangan bulat`);

  return z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(skema.nullable());
};

export const profilKecamatanSchema = z.object({
  nama_kecamatan: teks(150),
  sejarah: teks(10000),
  sejarah_en: teks(10000),
  visi: teks(2000),
  visi_en: teks(2000),
  misi: teks(5000),
  misi_en: teks(5000),
  jumlah_asn: angka("Jumlah ASN", 0, 100000, true),

  alamat: teks(300),
  telepon: teks(30),
  email,
  jam_operasional: teks(200),
  koordinat_lat: angka("Koordinat lintang", -90, 90),
  koordinat_lng: angka("Koordinat bujur", -180, 180),

  ppid_dasar_hukum: teks(500),
  ppid_nama_petugas: teks(150),
  ppid_kontak: teks(300),
  ppid_jam_layanan: teks(200),
  maklumat_pelayanan: teks(5000),
  maklumat_pelayanan_en: teks(5000),

  nama_pejabat_utama: teks(150),
  jabatan_pejabat_utama: teks(150),
  foto_pejabat_utama_url: teks(2048),
  sambutan_pejabat_utama: teks(5000),
});

export type ProfilKecamatanInput = z.output<typeof profilKecamatanSchema>;

export const pejabatSchema = z.object({
  nama_pejabat: z
    .string()
    .trim()
    .min(3, "Nama pejabat minimal 3 karakter")
    .max(150, "Nama pejabat maksimal 150 karakter"),
  jabatan: z
    .string()
    .trim()
    .min(3, "Jabatan minimal 3 karakter")
    .max(150, "Jabatan maksimal 150 karakter"),
  foto_url: teks(2048),
  urutan: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 0))
    .pipe(
      z
        .number({ error: "Urutan harus berupa angka" })
        .int("Urutan harus bilangan bulat")
        .min(0, "Urutan tidak boleh negatif")
        .max(999, "Urutan maksimal 999")
    ),
});

export type PejabatInput = z.output<typeof pejabatSchema>;
