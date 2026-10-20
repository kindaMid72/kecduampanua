"use client";

import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/ErrorState";
import { useEffect } from "react";

// Menangkap error dari layout (termasuk Navbar/Footer), bukan hanya dari halaman publik.
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <ErrorState
        title={t("500Title")}
        message={t("500Desc")}
        action={{ label: t("500Retry"), onClick: reset }}
      />
    </div>
  );
}
