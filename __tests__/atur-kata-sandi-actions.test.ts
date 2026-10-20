import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake Supabase admin client. Setiap tes mengatur respons lewat `db`
// dan memeriksa `writes` untuk memastikan apa yang benar-benar ditulis.
const db = vi.hoisted(() => ({
  invite: null as null | Record<string, unknown>,
  claimRows: [{ id: "inv-1" }] as Array<{ id: string }>,
  profileStatus: "aktif" as string | null,
  authUsers: [] as Array<{ id: string; email: string }>,
  authPages: null as null | Array<Array<{ id: string; email: string }>>,
  writes: [] as Array<{ table: string; op: string; payload?: Record<string, unknown> }>,
  authError: null as null | { message: string },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const ctx: { op: "select" | "update" | "upsert"; payload?: Record<string, unknown>; isUsedAtNull: boolean } = {
        op: "select",
        isUsedAtNull: false,
      };

      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        is: (col: string) => {
          if (col === "used_at") ctx.isUsedAtNull = true;
          return chain;
        },
        update: (payload: Record<string, unknown>) => {
          ctx.op = "update";
          ctx.payload = payload;
          return chain;
        },
        upsert: (payload: Record<string, unknown>) => {
          ctx.op = "upsert";
          ctx.payload = payload;
          db.writes.push({ table, op: "upsert", payload });
          return Promise.resolve({ error: null });
        },
        maybeSingle: async () => {
          if (table === "user_invitations" && ctx.op === "select") {
            return { data: db.invite, error: null };
          }
          if (table === "user_invitations" && ctx.op === "update") {
            db.writes.push({ table, op: "update", payload: ctx.payload });
            // Klaim: hanya berhasil bila used_at masih null. Pelepasan (used_at=null) selalu berhasil.
            if (ctx.payload && "used_at" in ctx.payload && ctx.payload.used_at === null) {
              return { data: { id: "inv-1" }, error: null };
            }
            return { data: db.claimRows[0] ?? null, error: null };
          }
          if (table === "profiles" && ctx.op === "select") {
            return { data: db.profileStatus === null ? null : { status: db.profileStatus }, error: null };
          }
          return { data: null, error: null };
        },
        then: (resolve: (v: unknown) => void) => {
          // Dipakai untuk update/eq tanpa maybeSingle (mis. profiles.update, user_invitations release)
          if (ctx.op === "update") {
            db.writes.push({ table, op: "update", payload: ctx.payload });
          }
          resolve({ error: null });
        },
      };
      return chain;
    },
    auth: {
      admin: {
        listUsers: async ({ page }: { page: number; perPage: number }) => {
          if (db.authError) return { data: null, error: db.authError };
          const pages = db.authPages ?? [db.authUsers];
          const users = pages[page - 1] ?? [];
          return { data: { users }, error: null };
        },
        updateUserById: async (id: string, attrs: Record<string, unknown>) => {
          db.writes.push({ table: "auth", op: "updateUserById", payload: { id, ...attrs } });
          return { error: null };
        },
        createUser: async (attrs: Record<string, unknown>) => {
          db.writes.push({ table: "auth", op: "createUser", payload: attrs });
          return { data: { user: { id: "new-user" } }, error: null };
        },
      },
    },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { selesaikanAturKataSandiAction } from "@/app/admin/atur-kata-sandi/actions";

const input = { token: "token-uji", password: "Password123", konfirmasi: "Password123" };

function inviteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv-1",
    email: "staf@contoh.test",
    nama_lengkap: "Staf Uji",
    role: "staf",
    type: "reset_password",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    used_at: null,
    user_id: "user-1",
    ...overrides,
  };
}

beforeEach(() => {
  db.invite = inviteRow();
  db.claimRows = [{ id: "inv-1" }];
  db.profileStatus = "aktif";
  db.authUsers = [];
  db.authPages = null;
  db.writes = [];
  db.authError = null;
});

describe("selesaikanAturKataSandiAction", () => {
  it("reset kata sandi untuk akun aktif berhasil dan tidak menulis status", async () => {
    const hasil = await selesaikanAturKataSandiAction(input);

    expect(hasil).toEqual({ success: true });
    const profileWrite = db.writes.find((w) => w.table === "profiles" && w.op === "update");
    expect(profileWrite?.payload).toEqual({ password_set: true });
    expect(profileWrite?.payload).not.toHaveProperty("status");
  });

  it("reset untuk akun nonaktif ditolak dan tidak mengubah apa pun", async () => {
    db.profileStatus = "nonaktif";

    const hasil = await selesaikanAturKataSandiAction(input);

    expect(hasil.error).toContain("nonaktif");
    expect(db.writes.some((w) => w.table === "auth" && w.op === "updateUserById")).toBe(false);
    expect(db.writes.some((w) => w.table === "profiles")).toBe(false);
  });

  it("undangan untuk akun yang sudah nonaktif tidak mengaktifkannya kembali", async () => {
    db.invite = inviteRow({ type: "invite", user_id: null });
    db.authUsers = [{ id: "user-lama", email: "staf@contoh.test" }];
    db.profileStatus = "nonaktif";

    const hasil = await selesaikanAturKataSandiAction(input);

    expect(hasil.error).toContain("nonaktif");
    expect(db.writes.some((w) => w.table === "profiles" && w.op === "upsert")).toBe(false);
  });

  it("klaim paralel yang kalah ditolak tanpa mengubah kata sandi", async () => {
    db.claimRows = []; // klaim atomik tidak mengenai baris (used_at sudah terisi request lain)

    const hasil = await selesaikanAturKataSandiAction(input);

    expect(hasil.error).toContain("sudah pernah digunakan");
    expect(db.writes.some((w) => w.table === "auth")).toBe(false);
  });

  it("jika langkah setelah klaim gagal, klaim dilepas agar tautan bisa dipakai ulang", async () => {
    db.authError = { message: "upstream error" };
    db.invite = inviteRow({ type: "invite", user_id: null });

    const hasil = await selesaikanAturKataSandiAction(input);

    expect(hasil.error).toBeTruthy();
    const pelepasan = db.writes.find(
      (w) => w.table === "user_invitations" && w.op === "update" && w.payload?.used_at === null
    );
    expect(pelepasan).toBeDefined();
  });

  it("mencari akun di halaman kedua listUsers (tidak terbatas 50 pertama)", async () => {
    db.invite = inviteRow({ type: "invite", user_id: null });
    const halaman1 = Array.from({ length: 200 }, (_, i) => ({ id: `u${i}`, email: `x${i}@contoh.test` }));
    db.authPages = [halaman1, [{ id: "user-halaman-2", email: "staf@contoh.test" }]];

    const hasil = await selesaikanAturKataSandiAction(input);

    expect(hasil).toEqual({ success: true });
    const updateAuth = db.writes.find((w) => w.op === "updateUserById");
    expect(updateAuth?.payload?.id).toBe("user-halaman-2");
    expect(db.writes.some((w) => w.op === "createUser")).toBe(false);
  });
});
