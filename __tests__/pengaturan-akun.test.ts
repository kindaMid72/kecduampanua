import { describe, it, expect } from "vitest";
import {
  updateProfilMandiriSchema,
  gantiKataSandiSchema,
} from "@/lib/validations/auth";

describe("Validasi Update Profil Mandiri Schema", () => {
  it("menerima nama lengkap yang valid", () => {
    const validData = {
      nama_lengkap: "Ahmad Dahlan",
    };
    const result = updateProfilMandiriSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("menolak nama lengkap yang kosong atau hanya spasi", () => {
    const invalidData = {
      nama_lengkap: "    ",
    };
    const result = updateProfilMandiriSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("wajib diisi");
    }
  });
});

describe("Validasi Ganti Kata Sandi Mandiri Schema", () => {
  it("menerima input ganti kata sandi yang valid", () => {
    const validData = {
      kata_sandi_lama: "SandiLama123",
      kata_sandi_baru: "SandiBaru2026",
      konfirmasi_kata_sandi_baru: "SandiBaru2026",
    };
    const result = gantiKataSandiSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("menolak jika kata sandi lama kosong", () => {
    const invalidData = {
      kata_sandi_lama: "",
      kata_sandi_baru: "SandiBaru2026",
      konfirmasi_kata_sandi_baru: "SandiBaru2026",
    };
    const result = gantiKataSandiSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("saat ini wajib diisi");
    }
  });

  it("menolak jika kata sandi baru kurang dari 8 karakter", () => {
    const invalidData = {
      kata_sandi_lama: "SandiLama123",
      kata_sandi_baru: "Pass1",
      konfirmasi_kata_sandi_baru: "Pass1",
    };
    const result = gantiKataSandiSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("minimal 8 karakter");
    }
  });

  it("menolak jika kata sandi baru tidak memiliki huruf kapital", () => {
    const invalidData = {
      kata_sandi_lama: "SandiLama123",
      kata_sandi_baru: "sandibaru123",
      konfirmasi_kata_sandi_baru: "sandibaru123",
    };
    const result = gantiKataSandiSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("huruf kapital");
    }
  });

  it("menolak jika kata sandi baru tidak memiliki angka", () => {
    const invalidData = {
      kata_sandi_lama: "SandiLama123",
      kata_sandi_baru: "SandiBaruLengkap",
      konfirmasi_kata_sandi_baru: "SandiBaruLengkap",
    };
    const result = gantiKataSandiSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("angka");
    }
  });

  it("menolak jika konfirmasi kata sandi baru tidak cocok", () => {
    const invalidData = {
      kata_sandi_lama: "SandiLama123",
      kata_sandi_baru: "SandiBaru123",
      konfirmasi_kata_sandi_baru: "SandiBeda123",
    };
    const result = gantiKataSandiSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("tidak cocok");
    }
  });
});
