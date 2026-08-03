import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("informasiTitle"),
    description: t("informasiDesc"),
  };
}

export const revalidate = false;

type KategoriInfoMap = {
  pengumuman: "default";
  kegiatan: "info";
  jadwal_rapat: "warning";
};

const kategoriBadge: KategoriInfoMap = {
  pengumuman: "default",
  kegiatan: "info",
  jadwal_rapat: "warning",
};

export default async function InformasiPublikListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { locale } = await params;
  const { kategori } = await searchParams;
  const isEn = locale === "en";

  const tInfoPublik = await getTranslations({ locale, namespace: "informasiPublik" });

  const kategoriLabel: Record<string, string> = {
    pengumuman: tInfoPublik("pengumuman"),
    kegiatan: tInfoPublik("kegiatan"),
    jadwal_rapat: tInfoPublik("jadwalRapat"),
  };

  const categories = [
    { key: "all", label: tInfoPublik("filterSemua"), href: `/${locale}/informasi` },
    { key: "pengumuman", label: tInfoPublik("pengumuman"), href: `/${locale}/informasi?kategori=pengumuman` },
    { key: "kegiatan", label: tInfoPublik("kegiatan"), href: `/${locale}/informasi?kategori=kegiatan` },
    { key: "jadwal_rapat", label: tInfoPublik("jadwalRapat"), href: `/${locale}/informasi?kategori=jadwal_rapat` },
  ];

  let items: {
    id: string;
    judul: string;
    judul_en: string | null;
    konten: string;
    konten_en: string | null;
    kategori: string;
    tanggal_acara: string | null;
    lokasi: string | null;
    created_at: string;
    slug: string;
  }[] = [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from("informasi_publik")
      .select("id, judul, judul_en, konten, konten_en, kategori, tanggal_acara, lokasi, created_at, slug")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (kategori && ["pengumuman", "kegiatan", "jadwal_rapat"].includes(kategori)) {
      query = query.eq("kategori", kategori);
    }

    const { data } = await query;
    items = data ?? [];
  } catch {
    // Graceful
  }

  const activeKategori = kategori ?? "all";

  return (
    <>
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <CategoryLabel label={tInfoPublik("category")} className="mb-1 block" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary mb-2">
          {tInfoPublik("title")}
        </h1>
        <p className="text-text/60 text-base max-w-xl">
          {tInfoPublik("subtitle")}
        </p>
      </section>

      <SectionDivider />

      <section className="max-w-6xl mx-auto px-4 py-10" aria-label={tInfoPublik("title")}>
        {/* Kategori Filter Tabs */}
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

        {/* List Content */}
        {items.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-text/50 italic text-sm">
              {tInfoPublik("placeholderList")}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const kat = item.kategori as keyof typeof kategoriBadge;
              const tanggal = new Date(item.created_at).toLocaleDateString(
                locale === "en" ? "en-GB" : "id-ID",
                { day: "numeric", month: "long", year: "numeric" }
              );

              return (
                <Link
                  key={item.id}
                  href={`/${locale}/informasi/${item.slug}`}
                  className="block h-full"
                >
                  <Card interactive padding="md" className="h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Badge variant={kategoriBadge[kat] ?? "default"}>
                          {kategoriLabel[kat] ?? kat}
                        </Badge>
                        <time
                          dateTime={item.created_at}
                          className="text-xs font-mono text-text/40 flex-shrink-0"
                        >
                          {tanggal}
                        </time>
                      </div>
                      <h2 className="font-display font-semibold text-text text-base leading-snug mb-2 line-clamp-2">
                        {judul}
                      </h2>
                    </div>

                    {(item.tanggal_acara || item.lokasi) && (
                      <div className="mt-4 pt-3 border-t border-surface space-y-1 text-xs text-text/60">
                        {item.tanggal_acara && (
                          <p className="flex items-center gap-1.5 font-mono">
                            <Calendar size={13} className="text-secondary flex-shrink-0" aria-hidden="true" />
                            <span>{new Date(item.tanggal_acara).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </p>
                        )}
                        {item.lokasi && (
                          <p className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-accent flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">{item.lokasi}</span>
                          </p>
                        )}
                      </div>
                    )}
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
