import { beforeEach, describe, expect, test, vi } from "vitest";

// --- Mock dependensi server ---
const headerMap = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: (k: string) => headerMap.get(k) ?? null })),
}));

// Semua akses data pengaduan dari server memakai service role (admin client).
const rpcMock = vi.fn(); // dipanggil dengan (nama, args)
const insertMock = vi.fn();
const createAdminClientMock = vi.fn(() => ({
  rpc: rpcMock,
  from: () => ({ insert: insertMock }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClientMock() }));

// Client anon TIDAK boleh dipakai lagi oleh action pengaduan.
const anonClientMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: (...a: unknown[]) => anonClientMock(...a) }));

import {
  cekStatusPengaduanAction,
  submitPengaduanAction,
} from "@/app/[locale]/(public)/kontak/pengaduan/actions";

let rateLimitResult: { data: boolean | null; error: unknown } = { data: true, error: null };
let statusResult: { data: unknown; error: unknown } = { data: [], error: null };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  headerMap.clear();
  headerMap.set("x-real-ip", "203.0.113.7");
  rateLimitResult = { data: true, error: null };
  statusResult = { data: [], error: null };
  createAdminClientMock.mockImplementation(() => ({ rpc: rpcMock, from: () => ({ insert: insertMock }) }));
  rpcMock.mockImplementation(async (name: string) =>
    name === "check_rate_limit" ? rateLimitResult : statusResult
  );
});

const rpcCalls = (name: string) => rpcMock.mock.calls.filter((c) => c[0] === name);

describe("cekStatusPengaduanAction", () => {
  test("menolak format tidak valid tanpa menyentuh database", async () => {
    for (const bad of ["", "abc", "PND-123", "PND-ZZZZZZZZ", "' or 1=1 --", "PND-8A7B6C5D9", "PND-8A7B6C5D9E0F1"]) {
      expect(await cekStatusPengaduanAction(bad)).toEqual({ error: "invalid" });
    }
    expect(rpcMock).not.toHaveBeenCalled();
  });

  test("menerima nomor lama (8 hex) dan baru (12 hex), dinormalisasi ke huruf besar", async () => {
    await cekStatusPengaduanAction("  pnd-8a7b6c5d ");
    await cekStatusPengaduanAction("pnd-8a7b6c5d9e0f");
    expect(rpcCalls("get_pengaduan_by_tracking").map((c) => c[1])).toEqual([
      { nomor: "PND-8A7B6C5D" },
      { nomor: "PND-8A7B6C5D9E0F" },
    ]);
  });

  test("RPC dipanggil lewat service role, bukan client anon", async () => {
    await cekStatusPengaduanAction("PND-8A7B6C5D");
    expect(createAdminClientMock).toHaveBeenCalled();
    expect(anonClientMock).not.toHaveBeenCalled();
  });

  test("rate limit (key cek:<ip>) terlampaui -> rateLimited tanpa query status", async () => {
    rateLimitResult = { data: false, error: null };
    expect(await cekStatusPengaduanAction("PND-8A7B6C5D")).toEqual({ error: "rateLimited" });
    expect(rpcCalls("check_rate_limit")[0][1]).toEqual({
      client_ip: "cek:203.0.113.7",
      max_hits: 20,
      window_minutes: 10,
    });
    expect(rpcCalls("get_pengaduan_by_tracking")).toHaveLength(0);
  });

  test("FAIL-CLOSED: pengecekan rate limit error -> unavailable, status tidak dibaca", async () => {
    rateLimitResult = { data: null, error: { message: "permission denied" } };
    expect(await cekStatusPengaduanAction("PND-8A7B6C5D")).toEqual({ error: "unavailable" });
    expect(rpcCalls("get_pengaduan_by_tracking")).toHaveLength(0);
  });

  test("FAIL-CLOSED: admin client tidak bisa dibuat (service key kosong) -> unavailable", async () => {
    createAdminClientMock.mockImplementation(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY harus diset");
    });
    expect(await cekStatusPengaduanAction("PND-8A7B6C5D")).toEqual({ error: "unavailable" });
  });

  test("nomor tak ada -> notFound; error RPC -> unavailable (dibedakan)", async () => {
    statusResult = { data: [], error: null };
    expect(await cekStatusPengaduanAction("PND-8A7B6C5D")).toEqual({ error: "notFound" });
    statusResult = { data: null, error: { message: "boom" } };
    expect(await cekStatusPengaduanAction("PND-8A7B6C5D")).toEqual({ error: "unavailable" });
  });

  test("hanya mengembalikan 4 field yang dibutuhkan UI", async () => {
    statusResult = {
      data: [
        {
          nomor_tracking: "PND-8A7B6C5D",
          status: "diproses",
          kategori: "infrastruktur",
          created_at: "2026-10-01T00:00:00Z",
          catatan_tindak_lanjut: "Sedang ditinjau",
          nama_pelapor: "tidak boleh bocor",
        },
      ],
      error: null,
    };
    expect(await cekStatusPengaduanAction("PND-8A7B6C5D")).toEqual({
      data: {
        status: "diproses",
        kategori: "infrastruktur",
        created_at: "2026-10-01T00:00:00Z",
        catatan_tindak_lanjut: "Sedang ditinjau",
      },
    });
  });

  test("IPv6 diringkas ke /64 sebagai key rate limit", async () => {
    headerMap.set("x-real-ip", "2001:db8:abcd:12:ffff:1:2:3");
    await cekStatusPengaduanAction("PND-8A7B6C5D");
    expect(rpcCalls("check_rate_limit")[0][1].client_ip).toBe("cek:2001:db8:abcd:12::/64");
  });

  test("x-forwarded-for dari klien TIDAK dipercaya sebagai pengganti x-real-ip", async () => {
    headerMap.delete("x-real-ip");
    headerMap.set("x-forwarded-for", "6.6.6.6");
    await cekStatusPengaduanAction("PND-8A7B6C5D");
    // NODE_ENV=test: tanpa x-real-ip rate limit dilewati, dan key 6.6.6.6 tidak pernah dipakai
    expect(rpcCalls("check_rate_limit")).toHaveLength(0);
  });

  test("produksi tanpa x-real-ip: semua berbagi key 'unknown' (bukan bypass)", async () => {
    headerMap.delete("x-real-ip");
    vi.stubEnv("NODE_ENV", "production");
    try {
      await cekStatusPengaduanAction("PND-8A7B6C5D");
      expect(rpcCalls("check_rate_limit")[0][1].client_ip).toBe("cek:unknown");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("submitPengaduanAction", () => {
  function form(over: Record<string, string> = {}) {
    const f = new FormData();
    const base: Record<string, string> = {
      nama_pelapor: "Budi Santoso",
      kontak_pelapor: "08123456789",
      kategori: "infrastruktur",
      deskripsi: "Jalan berlubang di dusun satu sejak bulan lalu.",
      setuju_data_pribadi: "true",
      honeypot: "",
      ...over,
    };
    Object.entries(base).forEach(([k, v]) => f.set(k, v));
    return f;
  }

  test("sukses: insert lewat service role, hanya kolom publik, nomor PND-<12 hex>", async () => {
    insertMock.mockResolvedValue({ error: null });
    const res = await submitPengaduanAction(form());
    expect(res).toMatchObject({ success: true });
    expect((res as { trackingId: string }).trackingId).toMatch(/^PND-[0-9A-F]{12}$/);
    expect(anonClientMock).not.toHaveBeenCalled();
    expect(Object.keys(insertMock.mock.calls[0][0]).sort()).toEqual(
      ["deskripsi", "kategori", "kontak_pelapor", "nama_pelapor", "nomor_tracking", "setuju_data_pribadi", "status"].sort()
    );
    expect(insertMock.mock.calls[0][0].status).toBe("baru");
  });

  test("bentrok nomor (23505) -> ulangi dengan nomor baru sampai berhasil", async () => {
    insertMock
      .mockResolvedValueOnce({ error: { code: "23505" } })
      .mockResolvedValueOnce({ error: { code: "23505" } })
      .mockResolvedValueOnce({ error: null });
    expect(await submitPengaduanAction(form())).toMatchObject({ success: true });
    expect(new Set(insertMock.mock.calls.map((c) => c[0].nomor_tracking)).size).toBe(3);
  });

  test("error selain 23505 tidak diulang dan tidak membocorkan detail", async () => {
    insertMock.mockResolvedValue({ error: { code: "42501", message: "rls detail" } });
    expect(await submitPengaduanAction(form())).toEqual({
      error: "Gagal mengirim pengaduan. Silakan coba lagi nanti.",
    });
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  test("5x bentrok berturut-turut -> berhenti dengan pesan umum", async () => {
    insertMock.mockResolvedValue({ error: { code: "23505" } });
    expect(await submitPengaduanAction(form())).toEqual({
      error: "Terjadi kesalahan internal. Silakan coba lagi.",
    });
    expect(insertMock).toHaveBeenCalledTimes(5);
  });

  test("rate limit (3/10 menit) terlampaui -> ditolak sebelum validasi/insert", async () => {
    rateLimitResult = { data: false, error: null };
    const res = await submitPengaduanAction(form());
    expect(res).toMatchObject({ error: expect.stringContaining("terlalu banyak") });
    expect(rpcCalls("check_rate_limit")[0][1]).toEqual({
      client_ip: "203.0.113.7",
      max_hits: 3,
      window_minutes: 10,
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  test("submit tetap fail-open bila rate limit error (warga tidak terblokir), tapi dilog", async () => {
    rateLimitResult = { data: null, error: { message: "db down" } };
    insertMock.mockResolvedValue({ error: null });
    expect(await submitPengaduanAction(form())).toMatchObject({ success: true });
    expect(console.error).toHaveBeenCalled();
  });

  test("honeypot terisi -> pura-pura sukses tapi tidak insert", async () => {
    expect(await submitPengaduanAction(form({ honeypot: "bot" }))).toBeDefined();
    expect(insertMock).not.toHaveBeenCalled();
  });

  test("honeypot terisi walau field lain tidak valid -> tetap sukses palsu, tanpa pesan validasi", async () => {
    const hasil = await submitPengaduanAction(form({ honeypot: "bot", nama_pelapor: "" }));
    expect(hasil).toMatchObject({ success: true });
    expect(insertMock).not.toHaveBeenCalled();
  });

  test("batas global terlampaui -> ditolak walau IP ini belum melewati batasnya", async () => {
    rpcMock.mockImplementation(async (name: string, args: { client_ip: string }) =>
      name === "check_rate_limit" && args.client_ip === "submit:global"
        ? { data: false, error: null }
        : rateLimitResult
    );

    const hasil = await submitPengaduanAction(form());
    expect(hasil.error).toContain("terlalu banyak pengaduan masuk");
    expect(insertMock).not.toHaveBeenCalled();
  });

  test("error insert dilog hanya kode dan pesan, tidak objek utuh (data pribadi)", async () => {
    insertMock.mockResolvedValue({
      error: { code: "42501", message: "rls detail", details: "Failing row contains (Budi Santoso, 0812...)" },
    });

    await submitPengaduanAction(form());

    const args = vi.mocked(console.error).mock.calls.flat();
    expect(args.some((a) => typeof a === "object" && a !== null)).toBe(false);
    expect(JSON.stringify(args)).not.toContain("Failing row");
  });

  test("validasi gagal -> tidak insert: tanpa persetujuan, atau deskripsi > 5000 karakter", async () => {
    expect(await submitPengaduanAction(form({ setuju_data_pribadi: "false" }))).toHaveProperty("error");
    expect(await submitPengaduanAction(form({ deskripsi: "x".repeat(5001) }))).toHaveProperty("error");
    expect(insertMock).not.toHaveBeenCalled();
  });

  test("service role tidak tersedia -> pesan umum, tanpa crash", async () => {
    createAdminClientMock.mockImplementation(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY harus diset");
    });
    expect(await submitPengaduanAction(form())).toEqual({
      error: "Gagal mengirim pengaduan. Silakan coba lagi nanti.",
    });
  });
});
