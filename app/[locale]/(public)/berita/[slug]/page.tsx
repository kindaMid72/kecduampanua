import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEn = locale === "en";

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("berita")
      .select("judul, judul_en")
      .eq("slug", slug)
      .eq("status", "published")
      .limit(1)
      .single();

    if (!data) return { title: "Berita" };
    const judul = isEn && data.judul_en ? data.judul_en : data.judul;
    return {
      title: `${judul} — Kecamatan Duampanua`,
    };
  } catch {
    return { title: "Berita" };
  }
}

export const revalidate = false;

export default async function BeritaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isEn = locale === "en";

  const tBerita = await getTranslations({ locale, namespace: "berita" });

  let item = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("berita")
      .select(
        "id, judul, judul_en, konten, konten_en, kategori, gambar_cover_url, created_at, slug"
      )
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
  const tanggal = new Date(item.created_at).toLocaleDateString(
    locale === "en" ? "en-GB" : "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <>
      <article className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Tombol Kembali */}
        <Link
          href={`/${locale}/berita`}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {tBerita("kembali")}
        </Link>

        {/* Kategori + Tanggal */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {item.kategori && (
            <span className="text-xs font-mono text-secondary font-semibold uppercase tracking-wide">
              {item.kategori}
            </span>
          )}
          <time dateTime={item.created_at} className="text-xs font-mono text-text/50">
            {tanggal}
          </time>
        </div>

        {/* Judul */}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary mb-6 leading-tight">
          {judul}
        </h1>

        {/* Gambar Cover */}
        {item.gambar_cover_url && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-8 bg-surface">
            <Image
              src={item.gambar_cover_url}
              alt={judul}
              fill
              unoptimized
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 900px"
            />
          </div>
        )}

        <SectionDivider className="mb-8" />

        {/* Konten Artikel */}
        <div className="prose prose-slate max-w-none text-text/85 leading-relaxed whitespace-pre-line text-base">
          {konten}
        </div>
      </article>
    </>
  );
}
