import { describe, expect, test } from "vitest";
import { dataStatistikSchema } from "@/lib/validations/data-statistik";

const dasar = { nama_desa_kelurahan: "Desa Contoh", tahun_data: "2025" };

describe("dataStatistikSchema", () => {
  test("kolom kosong menjadi null (belum diisi), bukan 0", () => {
    const hasil = dataStatistikSchema.parse({ ...dasar, jumlah_rumah_sakit: "", luas_wilayah_km2: "" });
    expect(hasil.jumlah_rumah_sakit).toBeNull();
    expect(hasil.luas_wilayah_km2).toBeNull();
  });

  test("kolom yang tidak dikirim sama sekali juga null", () => {
    const hasil = dataStatistikSchema.parse(dasar);
    expect(hasil.jumlah_puskesmas).toBeNull();
    expect(hasil.jumlah_penduduk).toBeNull();
  });

  test("nol sungguhan tetap nol", () => {
    const hasil = dataStatistikSchema.parse({ ...dasar, jumlah_posyandu: "0" });
    expect(hasil.jumlah_posyandu).toBe(0);
  });

  test("angka rusak ditolak dengan pesan", () => {
    const hasil = dataStatistikSchema.safeParse({ ...dasar, jumlah_sekolah: "abc" });
    expect(hasil.success).toBe(false);
  });

  test("angka negatif ditolak", () => {
    const hasil = dataStatistikSchema.safeParse({ ...dasar, jumlah_nelayan: "-5" });
    expect(hasil.success).toBe(false);
  });
});
