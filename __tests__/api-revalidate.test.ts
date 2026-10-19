import { beforeEach, describe, expect, test, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));

import { POST } from "@/app/api/revalidate/route";

function req(auth?: string, body: unknown = { type: "UPDATE", record: {} }) {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: auth ? { Authorization: auth } : {},
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.REVALIDATE_SECRET;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-jangan-dipakai";
});

describe("POST /api/revalidate", () => {
  test("REVALIDATE_SECRET belum diset -> 500 (gagal tertutup)", async () => {
    expect((await POST(req("Bearer apa-saja"))).status).toBe(500);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("tanpa header / secret salah -> 401", async () => {
    process.env.REVALIDATE_SECRET = "rahasia";
    expect((await POST(req())).status).toBe(401);
    expect((await POST(req("Bearer salah"))).status).toBe(401);
    expect((await POST(req("rahasia"))).status).toBe(401); // tanpa prefix Bearer
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("service role key TIDAK lagi diterima sebagai secret", async () => {
    process.env.REVALIDATE_SECRET = "rahasia";
    expect((await POST(req("Bearer service-role-jangan-dipakai"))).status).toBe(401);
  });

  test("secret benar -> revalidate", async () => {
    process.env.REVALIDATE_SECRET = "rahasia";
    const res = await POST(req("Bearer rahasia"));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
