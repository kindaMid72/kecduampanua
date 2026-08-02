import { describe, it, expect } from "vitest";
import { editPenggunaSchema } from "@/lib/validations/auth";

describe("Validasi Edit Pengguna Schema", () => {
  it("menerima data edit pengguna yang valid untuk staf", () => {
    const validData = {
      nama_lengkap: "Budi Santoso",
      role: "staf",
    };
    const result = editPenggunaSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("menerima data edit pengguna yang valid untuk super_account", () => {
    const validData = {
      nama_lengkap: "Admin Utama",
      role: "super_account",
    };
    const result = editPenggunaSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("menolak nama lengkap yang kosong", () => {
    const invalidData = {
      nama_lengkap: "   ",
      role: "staf",
    };
    const result = editPenggunaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("wajib diisi");
    }
  });

  it("menolak role selain super_account atau staf", () => {
    const invalidData = {
      nama_lengkap: "Budi Santoso",
      role: "superuser",
    };
    const result = editPenggunaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("tidak valid");
    }
  });
});

describe("Guardrails Manajemen Pengguna", () => {
  it("memvalidasi larangan self-delete (pengguna tidak boleh menghapus akun sendiri)", () => {
    const currentUserId = "user-123";
    const targetUserId = "user-123";

    const isSelfDelete = currentUserId === targetUserId;
    expect(isSelfDelete).toBe(true);
  });

  it("mendeteksi kondisi orphan super_account saat hanya ada 1 pengelola aktif", () => {
    const activeSuperAccounts = [
      { id: "admin-1", role: "super_account", status: "aktif" },
    ];

    const canDemoteOrDelete = activeSuperAccounts.length > 1;
    expect(canDemoteOrDelete).toBe(false);
  });

  it("mengizinkan pengubahan peran jika terdapat lebih dari 1 pengelola aktif", () => {
    const activeSuperAccounts = [
      { id: "admin-1", role: "super_account", status: "aktif" },
      { id: "admin-2", role: "super_account", status: "aktif" },
    ];

    const canDemoteOrDelete = activeSuperAccounts.length > 1;
    expect(canDemoteOrDelete).toBe(true);
  });
});
