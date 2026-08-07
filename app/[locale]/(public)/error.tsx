"use client";

import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/ErrorState";
import { useEffect } from "react";

export default function PublicError({
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
    <div className="container mx-auto py-12">
      <ErrorState
        title={t("500Title")}
        message={t("500Desc")}
        action={{ label: t("500Retry"), onClick: reset }}
      />
    </div>
  );
}
