import "@/app/globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// 404 untuk URL di luar [locale] dan /admin (misal /zzz). Tidak ada locale yang
// diketahui di sini, jadi teks Bahasa Indonesia dan tautan ke beranda Bahasa Indonesia.
export default function RootNotFound() {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col items-center justify-center bg-background text-text font-body antialiased p-4">
        <h1 className="text-2xl font-display font-semibold text-primary mb-3">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-text/70 mb-8 max-w-md text-center leading-relaxed">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <Button asChild variant="primary">
          <Link href="/id">Kembali ke Beranda</Link>
        </Button>
      </body>
    </html>
  );
}
