import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PapanInformasiPanel } from "@/components/ui/PapanInformasiPanel";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Phone,
  BookOpen,
  Users,
  Map,
  School,
  HeartPulse,
  Megaphone,
  TrendingUp,
  MapPin,
} from "lucide-react";
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

const potensiBadgeMap: Record<string, "default" | "info" | "warning" | "success"> = {
  ekonomi: "info",
  wisata: "success",
  pengolahan: "warning",
};

export default async function Beranda({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  const tBeranda = await getTranslations({ locale, namespace: "beranda" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tInfoPublik = await getTranslations({ locale, namespace: "informasiPublik" });
  const tPotensi = await getTranslations({ locale, namespace: "potensi" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  const kategoriLabel: Record<string, string> = {
    pengumuman: tInfoPublik("pengumuman"),
    kegiatan: tInfoPublik("kegiatan"),
    jadwal_rapat: tInfoPublik("jadwalRapat"),
  };

  let profil = null;
  let infos: any[] = [];
  let beritaTerkini: any[] = [];
  let potensiUnggulan: any[] = [];
  let dataStatistik: any[] = [];

  try {
    const supabase = await createClient();

    const [profilRes, infoRes, statistikRes, beritaRes, potensiRes] = await Promise.all([
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
        .select("*")
        .order("tahun_data", { ascending: false }),
      supabase
        .from("berita")
        .select("id, judul, judul_en, kategori, created_at, gambar_cover_url, slug")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("potensi_daerah")
        .select("id, judul, judul_en, kategori, deskripsi, deskripsi_en, lokasi, gambar_url")
        .eq("status", "published")
        .order("urutan", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    profil = profilRes.data;
    infos = infoRes.data ?? [];
    beritaTerkini = beritaRes.data ?? [];
    potensiUnggulan = potensiRes.data ?? [];
    dataStatistik = statistikRes.data ?? [];
  } catch {
    // Graceful — tampil dengan placeholder
  }

  // Agregasi Statistik Kecamatan
  let aggStatistik = {
    totalPenduduk: 0,
    luasWilayah: 0,
    fasilitasPendidikan: 0,
    fasilitasKesehatan: 0,
  };

  if (dataStatistik.length > 0) {
    const latestYear = dataStatistik[0].tahun_data;
    const latestData = dataStatistik.filter(d => d.tahun_data === latestYear);

    aggStatistik = latestData.reduce((acc, curr) => {
      acc.totalPenduduk += curr.jumlah_penduduk || 0;
      acc.luasWilayah += parseFloat(curr.luas_wilayah_km2 || 0);
      acc.fasilitasPendidikan += curr.jumlah_sekolah || 0;
      // Gabungkan semua faskes
      acc.fasilitasKesehatan += (curr.jumlah_rumah_sakit || 0) + (curr.jumlah_puskesmas || 0) + (curr.jumlah_posyandu || 0) + (curr.jumlah_klinik_apotek || 0);
      return acc;
    }, {
      totalPenduduk: 0,
      luasWilayah: 0,
      fasilitasPendidikan: 0,
      fasilitasKesehatan: 0,
    });
  }

  const jamLayanan = profil?.jam_operasional
    ? { hari: tBeranda("hariKerja"), jam: profil.jam_operasional }
    : null;

  // Logika sederhana statusBuka: Senin-Jumat, 08:00 - 16:00 WITA (UTC+8)
  const nowUtc = new Date();
  const witaHour = (nowUtc.getUTCHours() + 8) % 24;
  const utcDay = nowUtc.getUTCDay();
  // Adjust day based on hour offset crossing midnight
  let witaDay = utcDay;
  if (nowUtc.getUTCHours() + 8 >= 24) {
    witaDay = (utcDay + 1) % 7;
  }
  const isWorkDay = witaDay >= 1 && witaDay <= 5;
  const isWorkHour = witaHour >= 8 && witaHour < 16;
  const statusBuka = isWorkDay && isWorkHour;

  const aksesCapt = [
    { label: tNav("standarPelayanan"), href: `/${locale}/standar-pelayanan` },
    { label: tNav("pengaduan"), href: `/${locale}/kontak/pengaduan` },
    { label: tNav("potensiDaerah"), href: `/${locale}/potensi` },
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

        {/* Papan Informasi */}
        <PapanInformasiPanel
          statusBuka={statusBuka}
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

      {/* Statistik Kecamatan (Agregat) */}
      {dataStatistik.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="statistik-heading">
          <div className="flex items-center justify-between mb-6">
            <div>
              <CategoryLabel label="Statistik" className="mb-1 block" />
              <h2 id="statistik-heading" className="font-display text-2xl font-semibold text-primary">
                {tBeranda("statistikKecamatan")}
              </h2>
            </div>
            <Link
              href={`/${locale}/profil#statistik`}
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              {tBeranda("lihatSemua")}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="md" className="flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users size={20} />
              </div>
              <div>
                <div className="font-display text-2xl font-semibold text-primary mb-1">
                  {new Intl.NumberFormat("id-ID").format(aggStatistik.totalPenduduk)}
                </div>
                <div className="text-sm font-medium text-text/60">{tBeranda("totalPenduduk")}</div>
              </div>
            </Card>
            
            <Card padding="md" className="flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Map size={20} />
              </div>
              <div>
                <div className="font-display text-2xl font-semibold text-primary mb-1">
                  {new Intl.NumberFormat("id-ID").format(aggStatistik.luasWilayah)}
                </div>
                <div className="text-sm font-medium text-text/60">{tBeranda("luasWilayah")} ({tBeranda("satuanLuas")})</div>
              </div>
            </Card>

            <Card padding="md" className="flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <School size={20} />
              </div>
              <div>
                <div className="font-display text-2xl font-semibold text-primary mb-1">
                  {new Intl.NumberFormat("id-ID").format(aggStatistik.fasilitasPendidikan)}
                </div>
                <div className="text-sm font-medium text-text/60">{tBeranda("fasilitasPendidikan")}</div>
              </div>
            </Card>

            <Card padding="md" className="flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <HeartPulse size={20} />
              </div>
              <div>
                <div className="font-display text-2xl font-semibold text-primary mb-1">
                  {new Intl.NumberFormat("id-ID").format(aggStatistik.fasilitasKesehatan)}
                </div>
                <div className="text-sm font-medium text-text/60">{tBeranda("fasilitasKesehatan")}</div>
              </div>
            </Card>
          </div>
        </section>
      )}

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Berita Terkini */}
      <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="berita-heading">
        <div className="flex items-center justify-between mb-6">
          <div>
            <CategoryLabel label={tNav("berita")} className="mb-1 block" />
            <h2 id="berita-heading" className="font-display text-2xl font-semibold text-primary">
              {tBeranda("beritaTerkini")}
            </h2>
          </div>
          <Link
            href={`/${locale}/berita`}
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            {tBeranda("lihatSemua")}
          </Link>
        </div>

        {beritaTerkini.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-text/50 italic text-sm">
              {tBeranda("placeholderInfo")}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {beritaTerkini.map((item) => {
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const tanggal = new Date(item.created_at).toLocaleDateString(
                isEn ? "en-GB" : "id-ID",
                { day: "numeric", month: "long", year: "numeric" }
              );
              return (
                <Link key={item.id} href={`/${locale}/berita/${item.slug}`} className="block h-full group">
                  <Card interactive padding="none" className="h-full flex flex-col overflow-hidden">
                    <div className="relative w-full h-48 bg-surface">
                      {item.gambar_cover_url ? (
                        <Image
                          src={item.gambar_cover_url}
                          alt={judul}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text/20">
                          <span className="font-display text-4xl">{judul.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="default" className="text-xs">
                          {item.kategori || tNav("berita")}
                        </Badge>
                        <time dateTime={item.created_at} className="text-xs font-mono text-text/50">
                          {tanggal}
                        </time>
                      </div>
                      <h3 className="font-medium text-text text-base leading-snug line-clamp-3">
                        {judul}
                      </h3>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Potensi Daerah Unggulan */}
      <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="potensi-heading">
        <div className="flex items-center justify-between mb-6">
          <div>
            <CategoryLabel label={tNav("potensiDaerah")} className="mb-1 block" />
            <h2 id="potensi-heading" className="font-display text-2xl font-semibold text-primary">
              {tBeranda("potensiDaerahUnggulan")}
            </h2>
          </div>
          <Link
            href={`/${locale}/potensi`}
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            {tBeranda("lihatSemua")}
          </Link>
        </div>

        {potensiUnggulan.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-text/50 italic text-sm">
              {tBeranda("placeholderInfo")}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {potensiUnggulan.map((item) => {
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const deskripsi = isEn && item.deskripsi_en ? item.deskripsi_en : item.deskripsi;
              const katId = item.kategori as "ekonomi" | "wisata" | "pengolahan";

              return (
                <Link key={item.id} href={`/${locale}/potensi?k=${katId}`} className="block h-full group">
                  <Card interactive padding="none" className="overflow-hidden flex flex-col h-full">
                    <div className="relative w-full h-40 bg-surface">
                      {item.gambar_url ? (
                        <Image
                          src={item.gambar_url}
                          alt={judul}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text/20">
                          <span className="font-display text-4xl">{judul.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge variant={potensiBadgeMap[katId] || "default"} className="shadow-sm backdrop-blur-sm bg-white/90">
                          {tPotensi(`kategori.${katId}`)}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-display text-lg font-semibold text-text mb-2 line-clamp-2">
                        {judul}
                      </h3>
                      {item.lokasi && (
                        <div className="flex items-center gap-1.5 text-xs text-text/60 mb-2">
                          <MapPin size={14} className="flex-shrink-0" />
                          <span className="truncate">{item.lokasi}</span>
                        </div>
                      )}
                      <p className="text-sm text-text/70 line-clamp-2 leading-relaxed">
                        {deskripsi}
                      </p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Informasi Publik Terbaru */}
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
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const kat = item.kategori as keyof typeof kategoriBadge;
              const tanggal = new Date(item.created_at).toLocaleDateString(
                isEn ? "en-GB" : "id-ID",
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
      <section className="max-w-6xl mx-auto px-4 py-10 pb-16" aria-labelledby="akses-cepat-heading">
        <CategoryLabel label={tBeranda("layanan")} className="mb-1 block" />
        <h2 id="akses-cepat-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          {tBeranda("aksesCepat")}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" role="list">
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
              label: tNav("pengaduan"),
              desc: tBeranda("aksesCepatPengaduanDesc"),
              href: `/${locale}/kontak/pengaduan`,
              icon: Megaphone,
            },
            {
              label: tNav("potensiDaerah"),
              desc: tBeranda("aksesCepatPotensiDesc"),
              href: `/${locale}/potensi`,
              icon: TrendingUp,
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
                  <Card interactive padding="md" className="h-full flex flex-col">
                    <Icon
                      size={24}
                      className="text-secondary mb-3"
                      aria-hidden="true"
                    />
                    <h3 className="font-medium text-text mb-1 text-sm">{item.label}</h3>
                    <p className="text-xs text-text/60 leading-relaxed flex-1">{item.desc}</p>
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
