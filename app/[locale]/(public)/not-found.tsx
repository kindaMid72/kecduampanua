"use client";

import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/ErrorState";

export default function PublicNotFound() {
  const t = useTranslations("errors");

  return (
    <div className="container mx-auto py-12">
      <ErrorState
        title={t("404Title")}
        message={t("404Desc")}
        action={{ label: t("404Action"), href: "/" }}
      />
    </div>
  );
}
