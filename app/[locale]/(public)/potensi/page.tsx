import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
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
    .select("id, judul, judul_en, kategori, deskripsi, deskripsi_en, lokasi, gambar_url")
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

  const badgeColorMap: Record<string, "default" | "info" | "warning" | "success" | "inactive"> = {
    ekonomi: "info",
    wisata: "success",
    pengolahan: "warning",
  };

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
                <Card key={item.id} className="overflow-hidden flex flex-col group h-full">
                  <div className="relative w-full h-48 bg-surface">
                    {item.gambar_url ? (
                      <Image
                        src={item.gambar_url}
                        alt={judul}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text/20">
                        <span className="font-display text-4xl">{judul.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant={badgeColorMap[katId] || "default"} className="shadow-sm backdrop-blur-sm bg-white/90">
                        {tPotensi(`kategori.${katId}`)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-display text-lg font-semibold text-text mb-2 line-clamp-2">
                      {judul}
                    </h3>
                    {item.lokasi && (
                      <div className="flex items-center gap-1.5 text-xs text-text/60 mb-3">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{item.lokasi}</span>
                      </div>
                    )}
                    <p className="text-sm text-text/70 line-clamp-3 mb-4 leading-relaxed">
                      {deskripsi}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
