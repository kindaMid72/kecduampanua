import { afterEach, describe, expect, test, vi } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("dengan NEXT_PUBLIC_SITE_URL, baris Sitemap memakai origin situs", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://duampanua.contoh.test/");
    const hasil = robots();
    expect(hasil.sitemap).toBe("https://duampanua.contoh.test/sitemap.xml");
    expect(hasil.rules).toMatchObject({ disallow: ["/admin/", "/api/"] });
  });

  test("di produksi tanpa env: tidak melempar error, baris Sitemap dilewati", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const hasil = robots();
    expect(hasil.sitemap).toBeUndefined();
    expect(hasil.rules).toMatchObject({ disallow: ["/admin/", "/api/"] });
  });
});
