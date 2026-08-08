import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // VULN-02: Jangan hardcode hostname — baca dari env var agar tidak
        // terekspos di source code / git history.
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname,
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
  output: 'standalone', // local
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

