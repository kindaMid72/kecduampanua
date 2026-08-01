import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Admin Kecamatan Duampanua",
    default: "Panel Admin | Kecamatan Duampanua",
  },
  description: "Panel admin website resmi Kecamatan Duampanua.",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-background text-text font-body antialiased">
        {children}
      </body>
    </html>
  );
}
