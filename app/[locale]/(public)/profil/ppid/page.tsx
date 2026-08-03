import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("ppidTitle"),
    description: t("ppidDesc"),
  };
}

export const revalidate = false;

function Placeholder({ pesan }: { pesan: string }) {
  return <p className="text-sm text-text/50 italic">{pesan}</p>;
}

export default async function PPIDPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tPpid = await getTranslations({ locale, namespace: "ppid" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  let profil = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profil_kecamatan")
      .select("ppid_dasar_hukum, ppid_nama_petugas, ppid_kontak, ppid_jam_layanan")
      .limit(1)
      .single();
    profil = data;
  } catch {
    // Graceful
  }

  return (
    <>
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <CategoryLabel label={tPpid("tagline")} className="mb-1 block" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary mb-2">
          {tPpid("title")}
        </h1>
        <p className="text-text/60 text-base max-w-xl">
          {tPpid("subTitle")}
        </p>
      </section>

      <SectionDivider />

      {/* Dasar hukum */}
      <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="dasar-hukum-heading">
        <div className="flex items-start gap-3 mb-6">
          <ShieldCheck size={24} className="text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 id="dasar-hukum-heading" className="font-display text-2xl font-semibold text-primary">
              {tPpid("dasarHukum")}
            </h2>
          </div>
        </div>

        <Card padding="md" className="max-w-2xl">
          <p className="text-text/80 text-sm leading-relaxed">
            {profil?.ppid_dasar_hukum ?? tPpid("defaultDasarHukum")}
          </p>
        </Card>
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Petugas PPID */}
      <section
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="petugas-heading"
      >
        <h2 id="petugas-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          {tPpid("petugasPpid")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
          <Card padding="md">
            <p className="text-xs font-mono text-text/50 uppercase tracking-wide mb-1">
              {tPpid("namaPetugas")}
            </p>
            {profil?.ppid_nama_petugas ? (
              <p className="font-medium text-text">{profil.ppid_nama_petugas}</p>
            ) : (
              <Placeholder pesan={tCommon("sedangDiperbarui")} />
            )}
          </Card>

          <Card padding="md">
            <p className="text-xs font-mono text-text/50 uppercase tracking-wide mb-1">
              {tPpid("kontak")}
            </p>
            {profil?.ppid_kontak ? (
              <p className="font-medium text-text font-mono">{profil.ppid_kontak}</p>
            ) : (
              <Placeholder pesan={tCommon("sedangDiperbarui")} />
            )}
          </Card>

          <Card padding="md">
            <p className="text-xs font-mono text-text/50 uppercase tracking-wide mb-1">
              {tPpid("jamLayanan")}
            </p>
            {profil?.ppid_jam_layanan ? (
              <p className="font-medium text-text font-mono text-sm">{profil.ppid_jam_layanan}</p>
            ) : (
              <Placeholder pesan={tCommon("sedangDiperbarui")} />
            )}
          </Card>
        </div>
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Catatan */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <Card padding="md" className="max-w-2xl bg-primary/5 border-primary/20">
          <p className="text-sm text-text/70 leading-relaxed">
            <strong className="text-primary">{tPpid("catatan")}:</strong> {tPpid("catatanText")}
          </p>
        </Card>
      </section>
    </>
  );
}
