import { useTranslations } from "next-intl";

export default function Beranda() {
  const t = useTranslations("beranda");

  return (
    <main className="flex-1">
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-semibold text-primary mb-6">
          {t("title")}
        </h1>
        <p className="text-text/70">
          Website Resmi Kecamatan Duampanua — halaman ini sedang dalam
          pengembangan.
        </p>
      </section>
    </main>
  );
}
