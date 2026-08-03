import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("profilTitle"),
    description: t("profilDesc"),
  };
}

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

  const tProfil = await getTranslations({ locale, namespace: "profil" });

  let profil = null;
  let struktur: {
    id: string;
    nama_pejabat: string;
    jabatan: string;
    foto_url: string | null;
    urutan: number;
  }[] = [];
  let statistik: {
    id: string;
    nama_desa_kelurahan: string;
    jumlah_penduduk: number | null;
    tahun_data: number;
  }[] = [];

  try {
    const supabase = await createClient();
    const [profilRes, strukturRes, statistikRes] = await Promise.all([
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
      supabase
        .from("data_statistik")
        .select("id, nama_desa_kelurahan, jumlah_penduduk, tahun_data")
        .order("tahun_data", { ascending: false })
        .order("nama_desa_kelurahan", { ascending: true }),
    ]);
    profil = profilRes.data;
    struktur = strukturRes.data ?? [];
    statistik = statistikRes.data ?? [];
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
        <CategoryLabel label={tProfil("tentangKami")} className="mb-1 block" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary">
          {tProfil("title")}
        </h1>
      </section>

      <SectionDivider />

      {/* Sejarah */}
      <section
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="sejarah-heading"
      >
        <h2 id="sejarah-heading" className="font-display text-2xl font-semibold text-primary mb-4">
          {tProfil("sejarah")}
        </h2>
        {sejarah ? (
          <div className="prose prose-sm max-w-none text-text/80 leading-relaxed whitespace-pre-line">
            {sejarah}
          </div>
        ) : (
          <Placeholder pesan={tProfil("sejarahPlaceholder")} />
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Visi & Misi */}
      <section
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="visimisi-heading"
      >
        <h2 id="visimisi-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          {tProfil("visiMisi")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="md">
            <h3 className="font-medium text-primary mb-3">{tProfil("visi")}</h3>
            {visi ? (
              <p className="text-text/80 text-sm leading-relaxed">{visi}</p>
            ) : (
              <Placeholder pesan={tProfil("visiPlaceholder")} />
            )}
          </Card>
          <Card padding="md">
            <h3 className="font-medium text-primary mb-3">{tProfil("misi")}</h3>
            {misi ? (
              <p className="text-text/80 text-sm leading-relaxed whitespace-pre-line">{misi}</p>
            ) : (
              <Placeholder pesan={tProfil("misiPlaceholder")} />
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
          {tProfil("strukturOrganisasi")}
        </h2>
        {struktur.length === 0 ? (
          <Placeholder pesan={tProfil("strukturPlaceholder")} />
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
                        alt={tProfil("fotoAlt", { nama: pejabat.nama_pejabat })}
                        width={80}
                        height={80}
                        unoptimized
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
          {tProfil("jumlahAsn")}
        </h2>
        {profil?.jumlah_asn != null && (
          <Card padding="md" className="inline-flex items-baseline gap-3">
            <span className="font-display text-5xl font-semibold text-primary font-mono">
              {profil.jumlah_asn}
            </span>
            <span className="text-text/60 text-sm">{tProfil("asnSuffix")}</span>
          </Card>
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Data Statistik Penduduk */}
      <section
        id="statistik"
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="statistik-heading"
      >
        <h2 id="statistik-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          Data Statistik Penduduk
        </h2>
        {statistik.length === 0 ? (
          <Placeholder pesan="Data statistik belum tersedia." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statistik.map((stat) => (
              <Card key={stat.id} padding="md" className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text/60">{stat.nama_desa_kelurahan}</span>
                <span className="font-display text-3xl font-semibold text-primary">
                  {stat.jumlah_penduduk ? new Intl.NumberFormat("id-ID").format(stat.jumlah_penduduk) : "-"}
                </span>
                <span className="text-xs text-text/40">Tahun Data: {stat.tahun_data}</span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
