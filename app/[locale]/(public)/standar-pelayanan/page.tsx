import { createClient } from "@/lib/supabase/server";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Card } from "@/components/ui/Card";
import { CheckSquare, Clock, Download, ChevronDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Standar Pelayanan — Kecamatan Duampanua",
  description:
    "Prosedur, syarat dokumen, dan estimasi waktu layanan administrasi Kecamatan Duampanua.",
};

export const revalidate = false;

function Placeholder({ pesan }: { pesan: string }) {
  return <p className="text-sm text-text/50 italic py-2">{pesan}</p>;
}

export default async function StandarPelayananPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  let maklumat: string | null = null;
  let layananList: {
    id: string;
    nama_layanan: string;
    nama_layanan_en: string | null;
    deskripsi: string | null;
    deskripsi_en: string | null;
    syarat_dokumen: string[] | null;
    syarat_dokumen_en: string[] | null;
    alur_proses: string | null;
    alur_proses_en: string | null;
    estimasi_waktu: string | null;
    link_formulir_url: string | null;
    dokumen_standar_pelayanan_url: string | null;
    urutan: number;
  }[] = [];

  try {
    const supabase = await createClient();
    const [profilRes, layananRes] = await Promise.all([
      supabase
        .from("profil_kecamatan")
        .select("maklumat_pelayanan, maklumat_pelayanan_en")
        .limit(1)
        .single(),
      supabase
        .from("layanan")
        .select(
          "id, nama_layanan, nama_layanan_en, deskripsi, deskripsi_en, syarat_dokumen, syarat_dokumen_en, alur_proses, alur_proses_en, estimasi_waktu, link_formulir_url, dokumen_standar_pelayanan_url, urutan"
        )
        .eq("status", "aktif")
        .order("urutan", { ascending: true }),
    ]);

    const pm = profilRes.data;
    maklumat = (isEn && pm?.maklumat_pelayanan_en) ? pm.maklumat_pelayanan_en : pm?.maklumat_pelayanan ?? null;
    layananList = layananRes.data ?? [];
  } catch {
    // Graceful
  }

  return (
    <>
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <CategoryLabel label="Layanan Publik" className="mb-1 block" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary">
          Standar Pelayanan
        </h1>
      </section>

      <SectionDivider />

      {/* Maklumat Pelayanan */}
      <section
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="maklumat-heading"
      >
        <h2 id="maklumat-heading" className="font-display text-2xl font-semibold text-primary mb-4">
          Maklumat Pelayanan
        </h2>
        {maklumat ? (
          <Card padding="md" className="border-l-4 border-l-accent max-w-2xl">
            <p className="text-text/80 text-sm leading-relaxed italic">
              &ldquo;{maklumat}&rdquo;
            </p>
          </Card>
        ) : (
          <Card padding="md" className="max-w-2xl">
            <Placeholder pesan="Maklumat pelayanan sedang disiapkan." />
          </Card>
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Daftar Layanan — accordion */}
      <section
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="daftar-layanan-heading"
      >
        <h2
          id="daftar-layanan-heading"
          className="font-display text-2xl font-semibold text-primary mb-6"
        >
          Daftar Layanan
        </h2>

        {layananList.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-text/50 italic text-sm">
              Standar pelayanan sedang disiapkan oleh staf kecamatan.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {layananList.map((layanan, idx) => {
              const nama = isEn && layanan.nama_layanan_en ? layanan.nama_layanan_en : layanan.nama_layanan;
              const syarat: string[] = (isEn && layanan.syarat_dokumen_en?.length ? layanan.syarat_dokumen_en : layanan.syarat_dokumen) ?? [];
              const alur = isEn && layanan.alur_proses_en ? layanan.alur_proses_en : layanan.alur_proses;

              return (
                <details
                  key={layanan.id}
                  className="group border border-surface rounded-[var(--radius-card)] bg-surface/30"
                  open={idx === 0}
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none hover:bg-surface/60 transition-colors rounded-[var(--radius-card)]">
                    <div className="flex items-center gap-3">
                      <CategoryLabel
                        label={String(idx + 1).padStart(2, "0")}
                        className="text-accent"
                      />
                      <span className="font-medium text-text">{nama}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className="flex-shrink-0 text-text/40 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>

                  <div className="px-5 pb-5 pt-1 space-y-5 border-t border-surface">
                    {/* Syarat Dokumen */}
                    {syarat.length > 0 && (
                      <div>
                        <h3 className="text-xs font-mono text-text/50 uppercase tracking-wide mb-2">
                          Syarat Dokumen
                        </h3>
                        <ul className="space-y-1.5" role="list">
                          {syarat.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text/80">
                              <CheckSquare
                                size={14}
                                className="flex-shrink-0 mt-0.5 text-[color:var(--color-status-success)]"
                                aria-hidden="true"
                              />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Alur Prosedur — satu-satunya tempat angka urutan sah */}
                    {alur && (
                      <div>
                        <h3 className="text-xs font-mono text-text/50 uppercase tracking-wide mb-2">
                          Alur / Prosedur
                        </h3>
                        <ol className="space-y-2 pl-0" role="list">
                          {alur.split("\n").filter(Boolean).map((step: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-text/80">
                              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-mono">
                                {i + 1}
                              </span>
                              {step.replace(/^\d+[\.\)]\s*/, "")}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Estimasi waktu */}
                    {layanan.estimasi_waktu && (
                      <div className="flex items-center gap-2 text-sm text-text/70">
                        <Clock size={14} className="text-secondary" aria-hidden="true" />
                        <span>
                          <span className="font-mono text-text/50 uppercase text-xs tracking-wide mr-1">Estimasi:</span>
                          {layanan.estimasi_waktu}
                        </span>
                      </div>
                    )}

                    {/* Unduhan */}
                    <div className="flex flex-wrap gap-2">
                      {layanan.link_formulir_url && (
                        <a
                          href={layanan.link_formulir_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-secondary text-secondary rounded-[var(--radius-button)] hover:bg-secondary hover:text-white transition-colors min-h-[44px]"
                        >
                          <Download size={14} aria-hidden="true" />
                          Unduh Formulir
                        </a>
                      )}
                      {layanan.dokumen_standar_pelayanan_url && (
                        <a
                          href={layanan.dokumen_standar_pelayanan_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-primary/30 text-primary rounded-[var(--radius-button)] hover:bg-primary hover:text-white transition-colors min-h-[44px]"
                        >
                          <Download size={14} aria-hidden="true" />
                          Dok. Standar Pelayanan
                        </a>
                      )}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
