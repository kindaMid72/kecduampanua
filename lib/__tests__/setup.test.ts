import { describe, it, expect } from "vitest";

describe("setup verification", () => {
  it("vitest berjalan dengan benar", () => {
    expect(1 + 1).toBe(2);
  });

  it("environment variables tersedia", () => {
    // Hanya verifikasi format, bukan nilai aktual
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
