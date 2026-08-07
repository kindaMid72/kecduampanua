"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function AdminNotFound() {
  return (
    <div className="min-h-[50vh] bg-background flex flex-col items-center justify-center p-4">
      <ErrorState
        variant="admin"
        title="Halaman Tidak Ditemukan"
        message="Halaman admin yang Anda cari tidak ada atau sudah dipindahkan."
        action={{ label: "Kembali ke Dashboard", href: "/admin/dashboard" }}
      />
    </div>
  );
}
