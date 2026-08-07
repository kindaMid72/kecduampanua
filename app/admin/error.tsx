"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { useEffect } from "react";

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <ErrorState
        variant="page"
        title="Terjadi Kesalahan"
        message="Ada masalah teknis. Jika Anda sudah login, silakan kembali ke Dashboard."
        action={{ label: "Kembali ke Login", href: "/admin/login" }}
      />
    </div>
  );
}
