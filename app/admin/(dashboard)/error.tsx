"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { useEffect } from "react";

export default function AdminDashboardError({
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
    <div className="flex-1 flex items-center justify-center py-12">
      <ErrorState
        variant="admin"
        title="Terjadi Kesalahan"
        message="Ada masalah teknis saat memuat halaman ini. Silakan coba lagi."
        action={{ label: "Muat Ulang", onClick: reset }}
      />
    </div>
  );
}
