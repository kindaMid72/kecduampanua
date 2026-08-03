import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PapanInformasiPanel } from "@/components/ui/PapanInformasiPanel";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import Link from "next/link";
import { FileText, Phone, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("berandaTitle"),
    description: t("berandaDesc"),
  };
}

// Revalidate on-demand via /api/revalidate — bukan time-based
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

export default async function Beranda({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const tBeranda = await getTranslations({ locale, namespace: "beranda" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tInfoPublik = await getTranslations({ locale, namespace: "informasiPublik" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  const kategoriLabel: Record<string, string> = {
    pengumuman: tInfoPublik("pengumuman"),
    kegiatan: tInfoPublik("kegiatan"),
    jadwal_rapat: tInfoPublik("jadwalRapat"),
  };

  let profil = null;
  let infos: {
    id: string;
    judul: string;
    judul_en: string | null;
    kategori: string;
    created_at: string;
    gambar_cover_url: string | null;
    slug: string;
  }[] = [];
  let statistik: {
    id: string;
    nama_desa_kelurahan: string;
    jumlah_penduduk: number | null;
    tahun_data: number;
  }[] = [];

  try {
    const supabase = await createClient();

    const [profilRes, infoRes, statistikRes] = await Promise.all([
      supabase
        .from("profil_kecamatan")
        .select("jam_operasional, nama_kecamatan")
        .limit(1)
        .single(),
      supabase
        .from("informasi_publik")
        .select("id, judul, judul_en, kategori, created_at, gambar_cover_url, slug")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("data_statistik")
        .select("id, nama_desa_kelurahan, jumlah_penduduk, tahun_data")
        .order("tahun_data", { ascending: false })
        .order("nama_desa_kelurahan", { ascending: true })
        .limit(6),
    ]);

    profil = profilRes.data;
    infos = infoRes.data ?? [];
    statistik = statistikRes.data ?? [];
  } catch {
    // Graceful — tampil dengan placeholder
  }

  // Parse jam operasional sederhana untuk status buka
  // Format yang diharapkan: "Senin–Jumat, 08.00–16.00 WITA"
  // Untuk Fase 1, status buka null (belum ada logika waktu real-time)
  const jamLayanan = profil?.jam_operasional
    ? { hari: tBeranda("hariKerja"), jam: profil.jam_operasional }
    : null;

  const aksesCapt = [
    { label: tNav("standarPelayanan"), href: `/${locale}/standar-pelayanan` },
    { label: tNav("informasiPublik"), href: `/${locale}/informasi` },
    { label: tNav("kontak"), href: `/${locale}/kontak` },
  ];

  return (
    <>
      {/* Hero section */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="mb-3">
          <CategoryLabel label={tBeranda("selamatDatang")} />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary mb-2">
          {profil?.nama_kecamatan ?? tMeta("siteName")}
        </h1>
        <p className="text-text/60 text-base mb-8 max-w-xl">
          {tBeranda("tagline")}
        </p>

        {/* Papan Informasi — signature element, hanya di Beranda */}
        <PapanInformasiPanel
          statusBuka={null}
          jamLayanan={jamLayanan}
          aksesCapt={aksesCapt}
          labels={{
            papanInformasi: tBeranda("papanInformasi"),
            statusDiperbarui: tBeranda("statusKantorDiperbarui"),
            kantorBuka: tBeranda("kantorBuka"),
            kantorTutup: tBeranda("kantorTutup"),
            jamLayanan: tBeranda("jamLayanan"),
            jamLayananDiperbarui: tBeranda("jamLayananDiperbarui"),
            aksesCepat: tBeranda("aksesCepat"),
          }}
        />
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Data Statistik Singkat */}
      {statistik.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="statistik-heading">
          <div className="flex items-center justify-between mb-6">
            <div>
              <CategoryLabel label="Statistik" className="mb-1 block" />
              <h2 id="statistik-heading" className="font-display text-2xl font-semibold text-primary">
                Data Kependudukan
              </h2>
            </div>
            <Link
              href={`/${locale}/profil#statistik`}
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              Lihat Selengkapnya
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {statistik.map((stat) => (
              <Card key={stat.id} padding="sm" className="text-center flex flex-col justify-center gap-1">
                <span className="font-display text-xl font-semibold text-primary">
                  {stat.jumlah_penduduk ? new Intl.NumberFormat("id-ID").format(stat.jumlah_penduduk) : "-"}
                </span>
                <span className="text-xs font-medium text-text/60 line-clamp-2 leading-snug">
                  {stat.nama_desa_kelurahan}
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Informasi Terbaru */}
      <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="info-terbaru-heading">
        <div className="flex items-center justify-between mb-6">
          <div>
            <CategoryLabel label={tBeranda("terbaru")} className="mb-1 block" />
            <h2 id="info-terbaru-heading" className="font-display text-2xl font-semibold text-primary">
              {tBeranda("informasiTerbaru")}
            </h2>
          </div>
          <Link
            href={`/${locale}/informasi`}
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            {tBeranda("lihatSemua")}
          </Link>
        </div>

        {infos.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-text/50 italic text-sm">
              {tBeranda("placeholderInfo")}
            </p>
          </Card>
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
          >
            {infos.map((item) => {
              const judul = locale === "en" && item.judul_en ? item.judul_en : item.judul;
              const kat = item.kategori as keyof typeof kategoriBadge;
              const tanggal = new Date(item.created_at).toLocaleDateString(
                locale === "en" ? "en-GB" : "id-ID",
                { day: "numeric", month: "long", year: "numeric" }
              );
              return (
                <li key={item.id}>
                  <Link href={`/${locale}/informasi/${item.slug}`} className="block h-full">
                    <Card interactive padding="md" className="h-full flex flex-col">
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
                      <p className="font-medium text-text text-sm leading-snug flex-1">
                        {judul}
                      </p>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Akses Cepat grid */}
      <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="akses-cepat-heading">
        <CategoryLabel label={tBeranda("layanan")} className="mb-1 block" />
        <h2 id="akses-cepat-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          {tBeranda("aksesCepat")}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="list">
          {[
            {
              label: tNav("standarPelayanan"),
              desc: tBeranda("aksesCepatStandarPelayananDesc"),
              href: `/${locale}/standar-pelayanan`,
              icon: FileText,
            },
            {
              label: tNav("informasiPublik"),
              desc: tBeranda("aksesCepatInformasiDesc"),
              href: `/${locale}/informasi`,
              icon: BookOpen,
            },
            {
              label: tNav("kontak"),
              desc: tBeranda("aksesCepatKontakDesc"),
              href: `/${locale}/kontak`,
              icon: Phone,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} className="block h-full">
                  <Card interactive padding="md" className="h-full">
                    <Icon
                      size={24}
                      className="text-secondary mb-3"
                      aria-hidden="true"
                    />
                    <h3 className="font-medium text-text mb-1">{item.label}</h3>
                    <p className="text-sm text-text/60">{item.desc}</p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
