import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Card } from "@/components/ui/Card";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("beritaTitle"),
    description: t("beritaDesc"),
  };
}

export const revalidate = false;

export default async function BeritaListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { locale } = await params;
  const { kategori } = await searchParams;
  const isEn = locale === "en";

  const tBerita = await getTranslations({ locale, namespace: "berita" });

  let items: {
    id: string;
    judul: string;
    judul_en: string | null;
    konten: string;
    konten_en: string | null;
    kategori: string | null;
    gambar_cover_url: string | null;
    created_at: string;
    slug: string;
  }[] = [];

  let kategoriList: string[] = [];

  try {
    const supabase = await createClient();

    // Ambil semua kategori unik yang ada untuk filter tab
    const { data: kategoris } = await supabase
      .from("berita")
      .select("kategori")
      .eq("status", "published")
      .not("kategori", "is", null);

    kategoriList = [
      ...new Set(
        (kategoris ?? [])
          .map((k) => k.kategori)
          .filter((k): k is string => !!k)
      ),
    ].sort();

    let query = supabase
      .from("berita")
      .select(
        "id, judul, judul_en, konten, konten_en, kategori, gambar_cover_url, created_at, slug"
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (kategori) {
      query = query.eq("kategori", kategori);
    }

    const { data } = await query;
    items = data ?? [];
  } catch {
    // Graceful — tampilkan placeholder
  }

  const activeKategori = kategori ?? "all";

  const categories = [
    { key: "all", label: tBerita("filterSemua"), href: `/${locale}/berita` },
    ...kategoriList.map((k) => ({
      key: k,
      label: k,
      href: `/${locale}/berita?kategori=${encodeURIComponent(k)}`,
    })),
  ];

  return (
    <>
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <CategoryLabel label={tBerita("category")} className="mb-1 block" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary mb-2">
          {tBerita("title")}
        </h1>
        <p className="text-text/60 text-base max-w-xl">{tBerita("subtitle")}</p>
      </section>

      <SectionDivider />

      <section
        className="max-w-6xl mx-auto px-4 py-10"
        aria-label={tBerita("title")}
      >
        {/* Filter Kategori — hanya tampil jika ada lebih dari 1 kategori */}
        {kategoriList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => {
              const isActive = activeKategori === cat.key;
              return (
                <Link
                  key={cat.key}
                  href={cat.href}
                  className={[
                    "px-4 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors min-h-[44px] inline-flex items-center",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-surface/60 text-text/70 hover:bg-surface hover:text-text border border-surface",
                  ].join(" ")}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* List Berita */}
        {items.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-text/50 italic text-sm">{tBerita("placeholderList")}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const tanggal = new Date(item.created_at).toLocaleDateString(
                locale === "en" ? "en-GB" : "id-ID",
                { day: "numeric", month: "long", year: "numeric" }
              );

              return (
                <Link
                  key={item.id}
                  href={`/${locale}/berita/${item.slug}`}
                  className="block h-full group"
                >
                  <Card interactive padding="none" className="h-full flex flex-col overflow-hidden">
                    {/* Gambar Cover */}
                    {item.gambar_cover_url && (
                      <div className="relative h-44 bg-surface flex-shrink-0 overflow-hidden">
                        <Image
                          src={item.gambar_cover_url}
                          alt={judul}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}

                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <div>
                        {item.kategori && (
                          <span className="inline-block text-xs font-mono text-secondary font-medium uppercase tracking-wide mb-2">
                            {item.kategori}
                          </span>
                        )}
                        <h2 className="font-display font-semibold text-text text-base leading-snug line-clamp-2">
                          {judul}
                        </h2>
                      </div>
                      <time
                        dateTime={item.created_at}
                        className="text-xs font-mono text-text/40 mt-3 block"
                      >
                        {tanggal}
                      </time>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
