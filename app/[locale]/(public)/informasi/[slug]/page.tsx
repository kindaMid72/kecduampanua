import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEn = locale === "en";

  try {
    const t = await getTranslations({ locale, namespace: "metadata" });
    const supabase = await createClient();
    const { data } = await supabase
      .from("informasi_publik")
      .select("judul, judul_en")
      .eq("slug", slug)
      .eq("status", "published")
      .limit(1)
      .single();

    if (!data) return { title: "Informasi Publik" };
    const judul = isEn && data.judul_en ? data.judul_en : data.judul;
    return {
      title: `${judul} — ${t("siteFullName")}`,
    };
  } catch {
    return { title: "Informasi Publik" };
  }
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

export default async function InformasiPublikDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isEn = locale === "en";

  const tInfoPublik = await getTranslations({ locale, namespace: "informasiPublik" });

  const kategoriLabel: Record<string, string> = {
    pengumuman: tInfoPublik("pengumuman"),
    kegiatan: tInfoPublik("kegiatan"),
    jadwal_rapat: tInfoPublik("jadwalRapat"),
  };

  let item = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("informasi_publik")
      .select("id, judul, judul_en, konten, konten_en, kategori, tanggal_acara, lokasi, created_at, slug")
      .eq("slug", slug)
      .eq("status", "published")
      .limit(1)
      .single();

    item = data;
  } catch {
    // Graceful
  }

  if (!item) {
    notFound();
  }

  const judul = isEn && item.judul_en ? item.judul_en : item.judul;
  const konten = isEn && item.konten_en ? item.konten_en : item.konten;
  const kat = item.kategori as keyof typeof kategoriBadge;
  const tanggal = new Date(item.created_at).toLocaleDateString(
    locale === "en" ? "en-GB" : "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <>
      <section className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Tombol Kembali */}
        <Link
          href={`/${locale}/informasi`}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {tInfoPublik("kembali")}
        </Link>

        {/* Metadata Header */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Badge variant={kategoriBadge[kat] ?? "default"}>
            {kategoriLabel[kat] ?? kat}
          </Badge>
          <time
            dateTime={item.created_at}
            className="text-xs font-mono text-text/50"
          >
            {tanggal}
          </time>
        </div>

        {/* Judul Utama */}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary mb-6 leading-tight">
          {judul}
        </h1>

        {/* Detail Acara / Rapat bila ada */}
        {(item.tanggal_acara || item.lokasi) && (
          <Card padding="md" className="mb-8 bg-surface/50 space-y-2 border-l-4 border-l-secondary">
            {item.tanggal_acara && (
              <div className="flex items-center gap-2 text-sm text-text/80">
                <Calendar size={16} className="text-secondary flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">{tInfoPublik("tanggalAcara")}:</span>
                <span className="font-mono">
                  {new Date(item.tanggal_acara).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {item.lokasi && (
              <div className="flex items-center gap-2 text-sm text-text/80">
                <MapPin size={16} className="text-accent flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">{tInfoPublik("lokasi")}:</span>
                <span>{item.lokasi}</span>
              </div>
            )}
          </Card>
        )}

        <SectionDivider className="mb-8" />

        {/* Konten Artikel */}
        <article className="prose prose-slate max-w-none text-text/85 leading-relaxed whitespace-pre-line text-base">
          {konten}
        </article>
      </section>
    </>
  );
}
