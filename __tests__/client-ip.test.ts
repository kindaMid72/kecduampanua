import { describe, expect, test } from "vitest";
import { normalizeClientIp } from "@/lib/client-ip";

describe("normalizeClientIp", () => {
  test("IPv4 apa adanya", () => {
    expect(normalizeClientIp("203.0.113.7")).toBe("203.0.113.7");
    expect(normalizeClientIp("  203.0.113.7 ")).toBe("203.0.113.7");
  });
  test("IPv4-mapped IPv6 jadi IPv4", () => {
    expect(normalizeClientIp("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });
  test("IPv6 diringkas ke /64: alamat berbeda di blok yang sama -> key sama", () => {
    const a = normalizeClientIp("2001:db8:abcd:12:ffff:1:2:3");
    const b = normalizeClientIp("2001:0db8:abcd:0012::9");
    expect(a).toBe("2001:db8:abcd:12::/64");
    expect(b).toBe(a);
  });
  test("IPv6 dengan :: di tengah, awal, dan loopback", () => {
    expect(normalizeClientIp("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(normalizeClientIp("::1")).toBe("0:0:0:0::/64");
    expect(normalizeClientIp("fe80::1%eth0")).toBe("fe80:0:0:0::/64");
  });
  test("kosong / bukan IP -> null", () => {
    for (const bad of [null, undefined, "", "   ", "unknown", "6.6.6.6, 7.7.7.7", "999.1.1.1", "<script>"]) {
      expect(normalizeClientIp(bad as string)).toBeNull();
    }
  });
});
