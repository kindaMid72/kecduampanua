import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { PotensiCard } from "@/components/public/PotensiCard";
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
    title: t("potensiTitle"),
    description: t("potensiDesc"),
  };
}

export const revalidate = false;

export default async function PotensiDaerahPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const { k } = await searchParams; // kategori
  const kategoriParam = typeof k === "string" ? k : "semua";

  const tPotensi = await getTranslations({ locale, namespace: "potensi" });

  const supabase = await createClient();
  let query = supabase
    .from("potensi_daerah")
    .select("id, judul, judul_en, kategori, deskripsi, deskripsi_en, lokasi, gambar_url, video_url")
    .eq("status", "published")
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: false });

  if (kategoriParam !== "semua" && ["ekonomi", "wisata", "pengolahan"].includes(kategoriParam)) {
    query = query.eq("kategori", kategoriParam);
  }

  const { data: potensiList, error } = await query;
  
  if (error) {
    console.error(error);
  }

  const data = potensiList || [];
  const isEn = locale === "en";

  const KATEGORI = [
    { id: "semua", label: tPotensi("kategori.semua") },
    { id: "ekonomi", label: tPotensi("kategori.ekonomi") },
    { id: "wisata", label: tPotensi("kategori.wisata") },
    { id: "pengolahan", label: tPotensi("kategori.pengolahan") },
  ];

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14 text-center">
        <CategoryLabel label={tPotensi("title")} className="mb-2 mx-auto justify-center" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary mb-4">
          {tPotensi("title")}
        </h1>
        <p className="text-text/60 max-w-2xl mx-auto text-base">
          {tPotensi("subtitle")}
        </p>
      </section>

      <SectionDivider />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {KATEGORI.map((kat) => (
            <Link
              key={kat.id}
              href={`/${locale}/potensi${kat.id === "semua" ? "" : `?k=${kat.id}`}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                kategoriParam === kat.id
                  ? "bg-primary text-white"
                  : "bg-surface/50 text-text/60 hover:bg-surface hover:text-text"
              }`}
            >
              {kat.label}
            </Link>
          ))}
        </div>

        {data.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-text/50 italic">{tPotensi("emptyData")}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((item) => {
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const deskripsi = isEn && item.deskripsi_en ? item.deskripsi_en : item.deskripsi;
              const katId = item.kategori as "ekonomi" | "wisata" | "pengolahan";

              return (
                <PotensiCard
                  key={item.id}
                  id={item.id}
                  judul={judul}
                  deskripsi={deskripsi}
                  katId={katId}
                  lokasi={item.lokasi}
                  gambarUrl={item.gambar_url}
                  videoUrl={item.video_url}
                  badgeLabel={tPotensi(`kategori.${katId}`)}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
