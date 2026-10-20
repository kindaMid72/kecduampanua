"use client";

import "@/app/globals.css";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

// Dipakai saat root layout itu sendiri gagal. Tidak bisa memakai next-intl
// (provider ada di layout yang sedang gagal), jadi teks dibuat langsung dalam Bahasa Indonesia.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col items-center justify-center bg-background text-text font-body antialiased p-4">
        <h1 className="text-2xl font-display font-semibold text-primary mb-3">
          Terjadi Kesalahan
        </h1>
        <p className="text-text/70 mb-8 max-w-md text-center leading-relaxed">
          Ada masalah teknis saat memuat situs. Silakan coba lagi beberapa saat lagi.
        </p>
        <Button onClick={reset} variant="primary">
          Muat Ulang
        </Button>
      </body>
    </html>
  );
}
