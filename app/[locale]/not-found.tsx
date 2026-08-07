"use client";

import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/ErrorState";

export default function LocaleNotFound() {
  const t = useTranslations("errors");

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <ErrorState
        title={t("404Title")}
        message={t("404Desc")}
        action={{ label: t("404Action"), href: "/" }}
      />
    </div>
  );
}
