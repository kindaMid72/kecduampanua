import { afterEach, describe, expect, test, vi } from "vitest";
import { pejabatSchema, profilKecamatanSchema } from "@/lib/validations/profil";
import { getSiteUrl } from "@/lib/site-url";

describe("profilKecamatanSchema", () => {
  test("field kosong menjadi null, bukan string kosong", () => {
    const hasil = profilKecamatanSchema.parse({ alamat: "   ", visi: "" });
    expect(hasil.alamat).toBeNull();
    expect(hasil.visi).toBeNull();
  });

  test("koordinat rusak (NaN) ditolak, tidak tersimpan sebagai null diam-diam", () => {
    const hasil = profilKecamatanSchema.safeParse({ koordinat_lat: "abc" });
    expect(hasil.success).toBe(false);
    if (!hasil.success) expect(hasil.error.issues[0].message).toContain("harus berupa angka");
  });

  test("koordinat di luar rentang ditolak", () => {
    expect(profilKecamatanSchema.safeParse({ koordinat_lat: "91" }).success).toBe(false);
    expect(profilKecamatanSchema.safeParse({ koordinat_lng: "-181" }).success).toBe(false);
  });

  test("koordinat valid diubah ke angka", () => {
    const hasil = profilKecamatanSchema.parse({ koordinat_lat: "-3.8", koordinat_lng: "119.7" });
    expect(hasil.koordinat_lat).toBe(-3.8);
    expect(hasil.koordinat_lng).toBe(119.7);
  });

  test("jumlah ASN harus bilangan bulat dan tidak negatif", () => {
    expect(profilKecamatanSchema.safeParse({ jumlah_asn: "12.5" }).success).toBe(false);
    expect(profilKecamatanSchema.safeParse({ jumlah_asn: "-1" }).success).toBe(false);
    expect(profilKecamatanSchema.parse({ jumlah_asn: "42" }).jumlah_asn).toBe(42);
  });

  test("email tidak valid ditolak; email kosong diterima sebagai null", () => {
    expect(profilKecamatanSchema.safeParse({ email: "bukan-email" }).success).toBe(false);
    expect(profilKecamatanSchema.parse({ email: "" }).email).toBeNull();
    expect(profilKecamatanSchema.parse({ email: "kantor@contoh.test" }).email).toBe("kantor@contoh.test");
  });
});

describe("pejabatSchema", () => {
  test("nama terlalu pendek ditolak", () => {
    const hasil = pejabatSchema.safeParse({ nama_pejabat: "Ab", jabatan: "Camat", urutan: "1" });
    expect(hasil.success).toBe(false);
  });

  test("urutan kosong menjadi 0; urutan rusak ditolak", () => {
    const ok = pejabatSchema.parse({ nama_pejabat: "Budi Santoso", jabatan: "Camat", urutan: "" });
    expect(ok.urutan).toBe(0);
    expect(pejabatSchema.safeParse({ nama_pejabat: "Budi Santoso", jabatan: "Camat", urutan: "x" }).success).toBe(false);
  });
});

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("mengambil origin dari NEXT_PUBLIC_SITE_URL (tanpa path)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://duampanua.contoh.test/");
    expect(getSiteUrl()).toBe("https://duampanua.contoh.test");
  });

  test("produksi tanpa NEXT_PUBLIC_SITE_URL gagal jelas, tidak jatuh ke domain lain", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getSiteUrl()).toThrow("NEXT_PUBLIC_SITE_URL belum diset");
  });

  test("development tanpa env memakai localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
