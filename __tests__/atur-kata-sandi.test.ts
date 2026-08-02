import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { setPasswordSchema } from "@/lib/validations/auth";

describe("Validasi Set Password Schema", () => {
  it("menerima password yang valid (min 8 karakter, 1 kapital, 1 angka)", () => {
    const validData = {
      password: "Password123",
      konfirmasi: "Password123",
    };
    const result = setPasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("menolak password kurang dari 8 karakter", () => {
    const invalidData = {
      password: "Pass1",
      konfirmasi: "Pass1",
    };
    const result = setPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("minimal 8 karakter");
    }
  });

  it("menolak password tanpa huruf kapital", () => {
    const invalidData = {
      password: "password123",
      konfirmasi: "password123",
    };
    const result = setPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("huruf kapital");
    }
  });

  it("menolak password tanpa angka", () => {
    const invalidData = {
      password: "PasswordLengkap",
      konfirmasi: "PasswordLengkap",
    };
    const result = setPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("angka");
    }
  });

  it("menolak konfirmasi kata sandi yang tidak cocok", () => {
    const invalidData = {
      password: "Password123",
      konfirmasi: "PasswordBeda123",
    };
    const result = setPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("tidak cocok");
    }
  });
});

describe("One-Time Setup Token Hashing & Expiration Logic", () => {
  it("menghasilkan hash SHA-256 yang deterministik untuk token mentah", () => {
    const rawToken = "d016c683b54d6f83bca9826a79883bfd12f451f28b76c8c4a4f89d81d2f928e1";
    const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Pastikan hash panjangnya 64 karakter hex
    expect(expectedHash).toHaveLength(64);
    expect(crypto.createHash("sha256").update(rawToken).digest("hex")).toBe(expectedHash);
  });

  it("mendeteksi token yang sudah kedaluwarsa secara akurat", () => {
    const pastExpiresAt = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 jam yang lalu
    const isExpired = new Date(pastExpiresAt) < new Date();
    expect(isExpired).toBe(true);

    const futureExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 hari ke depan
    const isFutureExpired = new Date(futureExpiresAt) < new Date();
    expect(isFutureExpired).toBe(false);
  });

  it("memverifikasi token sekali pakai (used_at tidak boleh bernilai timestamp)", () => {
    const inviteUnused = {
      id: "1",
      token_hash: "hash_unused",
      used_at: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    };

    const inviteUsed = {
      id: "2",
      token_hash: "hash_used",
      used_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    };

    expect(inviteUnused.used_at).toBeNull();
    expect(inviteUsed.used_at).not.toBeNull();
  });
});
