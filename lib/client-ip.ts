import { isIP } from "net";

/**
 * Normalisasi IP klien untuk key rate limit.
 * - IPv4 dipakai apa adanya (termasuk bentuk ::ffff:1.2.3.4 -> 1.2.3.4).
 * - IPv6 diringkas ke prefix /64: satu pelanggan biasanya mendapat seluruh blok
 *   /64, jadi tanpa ini satu orang punya alamat tak terbatas untuk menghindari limit.
 * Mengembalikan null bila kosong/bukan IP valid.
 */
export function normalizeClientIp(raw: string | null | undefined): string | null {
  let ip = (raw ?? "").trim();
  if (!ip) return null;

  ip = ip.split("%")[0]; // buang zone id (fe80::1%eth0)
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) ip = mapped[1];

  const version = isIP(ip);
  if (version === 4) return ip;
  if (version !== 6) return null;

  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail !== undefined && tail ? tail.split(":") : [];
  const missing = 8 - headParts.length - tailParts.length;
  const full =
    tail === undefined
      ? headParts
      : [...headParts, ...Array(Math.max(missing, 0)).fill("0"), ...tailParts];

  const prefix = full.slice(0, 4).map((h) => h.toLowerCase().replace(/^0+(?=.)/, ""));
  return `${prefix.join(":")}::/64`;
}
