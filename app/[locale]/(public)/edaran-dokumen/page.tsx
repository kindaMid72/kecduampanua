import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import type { Metadata } from "next";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("edaranTitle"),
    description: t("edaranDesc"),
  };
}

export const revalidate = false;

export default async function EdaranDokumenPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const { k } = await searchParams; // kategori
  const kategoriParam = typeof k === "string" ? k : "semua";

  const tEdaran = await getTranslations({ locale, namespace: "edaran" });

  const supabase = await createClient();
  let query = supabase
    .from("edaran_dokumen")
    .select("id, judul, judul_en, nomor_dokumen, kategori, file_url, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (kategoriParam !== "semua" && ["regulasi", "panduan", "laporan", "lainnya"].includes(kategoriParam)) {
    query = query.eq("kategori", kategoriParam);
  }

  const { data: edaranList, error } = await query;
  
  if (error) {
    console.error(error);
  }

  const data = edaranList || [];
  const isEn = locale === "en";

  const KATEGORI = [
    { id: "semua", label: tEdaran("kategori.semua") },
    { id: "regulasi", label: tEdaran("kategori.regulasi") },
    { id: "panduan", label: tEdaran("kategori.panduan") },
    { id: "laporan", label: tEdaran("kategori.laporan") },
    { id: "lainnya", label: tEdaran("kategori.lainnya") },
  ];

  const badgeColorMap: Record<string, "default" | "info" | "warning" | "success" | "inactive"> = {
    regulasi: "warning",
    panduan: "info",
    laporan: "success",
    lainnya: "default",
  };

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14 text-center">
        <CategoryLabel label={tEdaran("title")} className="mb-2 mx-auto justify-center" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary mb-4">
          {tEdaran("title")}
        </h1>
        <p className="text-text/60 max-w-2xl mx-auto text-base">
          {tEdaran("subtitle")}
        </p>
      </section>

      <SectionDivider />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {KATEGORI.map((kat) => (
            <Link
              key={kat.id}
              href={`/${locale}/edaran-dokumen${kat.id === "semua" ? "" : `?k=${kat.id}`}`}
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
            <p className="text-text/50 italic">{tEdaran("emptyData")}</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((item) => {
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const katId = item.kategori as "regulasi" | "panduan" | "laporan" | "lainnya";
              const tanggal = format(new Date(item.created_at), "dd MMMM yyyy", { locale: isEn ? undefined : localeId });

              return (
                <Card key={item.id} padding="md" className="flex flex-col sm:flex-row sm:items-center gap-4 group">
                  <div className="w-12 h-12 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <FileText size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant={badgeColorMap[katId] || "default"}>
                        {tEdaran(`kategori.${katId}`)}
                      </Badge>
                      <span className="text-xs text-text/50 font-mono">
                        {tanggal}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-text mb-1 truncate">
                      {judul}
                    </h3>
                    {item.nomor_dokumen && (
                      <p className="text-sm text-text/60">
                        {tEdaran("nomor")} <span className="font-medium text-text">{item.nomor_dokumen}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 mt-2 sm:mt-0">
                    <a 
                      href={item.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors w-full sm:w-auto justify-center"
                    >
                      <Download size={16} />
                      <span>{tEdaran("lihat")}</span>
                    </a>
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
