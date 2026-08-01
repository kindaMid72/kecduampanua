import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Kecamatan — Kecamatan Duampanua",
  description:
    "Sejarah, visi-misi, struktur organisasi, dan informasi ASN Kecamatan Duampanua.",
};

export const revalidate = false;

function Placeholder({ pesan }: { pesan: string }) {
  return (
    <p className="text-sm text-text/50 italic py-4">
      {pesan}
    </p>
  );
}

export default async function ProfilPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let profil = null;
  let struktur: {
    id: string;
    nama_pejabat: string;
    jabatan: string;
    foto_url: string | null;
    urutan: number;
  }[] = [];

  try {
    const supabase = await createClient();
    const [profilRes, strukturRes] = await Promise.all([
      supabase
        .from("profil_kecamatan")
        .select(
          "sejarah, sejarah_en, visi, visi_en, misi, misi_en, jumlah_asn, maklumat_pelayanan, maklumat_pelayanan_en"
        )
        .limit(1)
        .single(),
      supabase
        .from("struktur_organisasi")
        .select("id, nama_pejabat, jabatan, foto_url, urutan")
        .order("urutan", { ascending: true }),
    ]);
    profil = profilRes.data;
    struktur = strukturRes.data ?? [];
  } catch {
    // Graceful — tampil placeholder
  }

  const isEn = locale === "en";

  const sejarah = isEn && profil?.sejarah_en ? profil.sejarah_en : profil?.sejarah;
  const visi    = isEn && profil?.visi_en    ? profil.visi_en    : profil?.visi;
  const misi    = isEn && profil?.misi_en    ? profil.misi_en    : profil?.misi;

  return (
    <>
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <CategoryLabel label="Tentang Kami" className="mb-1 block" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary">
          Profil Kecamatan
        </h1>
      </section>

      <SectionDivider />

      {/* Sejarah */}
      <section
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="sejarah-heading"
      >
        <h2 id="sejarah-heading" className="font-display text-2xl font-semibold text-primary mb-4">
          Sejarah
        </h2>
        {sejarah ? (
          <div className="prose prose-sm max-w-none text-text/80 leading-relaxed whitespace-pre-line">
            {sejarah}
          </div>
        ) : (
          <Placeholder pesan="Sejarah kecamatan sedang diperbarui." />
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Visi & Misi */}
      <section
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="visimisi-heading"
      >
        <h2 id="visimisi-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          Visi &amp; Misi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="md">
            <h3 className="font-medium text-primary mb-3">Visi</h3>
            {visi ? (
              <p className="text-text/80 text-sm leading-relaxed">{visi}</p>
            ) : (
              <Placeholder pesan="Visi sedang diperbarui." />
            )}
          </Card>
          <Card padding="md">
            <h3 className="font-medium text-primary mb-3">Misi</h3>
            {misi ? (
              <p className="text-text/80 text-sm leading-relaxed whitespace-pre-line">{misi}</p>
            ) : (
              <Placeholder pesan="Misi sedang diperbarui." />
            )}
          </Card>
        </div>
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Struktur Organisasi */}
      <section
        id="struktur"
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="struktur-heading"
      >
        <h2 id="struktur-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          Struktur Organisasi
        </h2>
        {struktur.length === 0 ? (
          <Placeholder pesan="Struktur organisasi sedang diperbarui." />
        ) : (
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            role="list"
          >
            {struktur.map((pejabat) => (
              <li key={pejabat.id}>
                <Card padding="sm" className="text-center">
                  <div className="mx-auto mb-3 h-20 w-20 rounded-full bg-surface overflow-hidden flex items-center justify-center">
                    {pejabat.foto_url ? (
                      <Image
                        src={pejabat.foto_url}
                        alt={`Foto ${pejabat.nama_pejabat}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span
                        className="text-2xl font-display text-text/20"
                        aria-hidden="true"
                      >
                        {pejabat.nama_pejabat.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-text text-sm leading-snug">
                    {pejabat.nama_pejabat}
                  </p>
                  <p className="text-xs text-text/60 mt-0.5">{pejabat.jabatan}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Jumlah ASN */}
      <section
        id="asn"
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="asn-heading"
      >
        <h2 id="asn-heading" className="font-display text-2xl font-semibold text-primary mb-4">
          Jumlah ASN
        </h2>
        {profil?.jumlah_asn != null ? (
          <Card padding="md" className="inline-flex items-baseline gap-3">
            <span className="font-display text-5xl font-semibold text-primary font-mono">
              {profil.jumlah_asn}
            </span>
            <span className="text-text/60 text-sm">orang ASN</span>
          </Card>
        ) : (
          <Placeholder pesan="Data jumlah ASN sedang diperbarui." />
        )}
      </section>
    </>
  );
}
