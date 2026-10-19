import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

// Host Storage Supabase untuk next/image. Dibaca saat BUILD — NEXT_PUBLIC_SUPABASE_URL
// harus diberikan sebagai build arg Docker (lihat Dockerfile).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  // Jangan beritahu versi framework lewat header X-Powered-By.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: supabaseUrl?.protocol === "http:" ? "http" : "https",
        // VULN-02: Jangan hardcode hostname — baca dari env var agar tidak
        // terekspos di source code / git history.
        hostname: supabaseUrl?.hostname ?? "localhost",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // VULN-11: Security headers — mencegah clickjacking, MIME sniffing, dan
  // kebocoran informasi referer.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Cegah iframe embedding dari origin lain (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Cegah MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Batasi informasi referer yang dikirim ke situs lain
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nonaktifkan fitur browser yang tidak dibutuhkan
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // Output minimal untuk image Docker (lihat Dockerfile).
  output: "standalone",
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      config.resolve.alias = {
        ...config.resolve.alias,
        "node:async_hooks": false,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);

