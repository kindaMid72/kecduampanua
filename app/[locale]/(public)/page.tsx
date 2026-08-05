import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { HeroSlider } from "@/components/ui/HeroSlider";
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
        .select("jam_operasional, nama_kecamatan, nama_pejabat_utama, jabatan_pejabat_utama, foto_pejabat_utama_url, sambutan_pejabat_utama")
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

  // Tentukan apakah slide 2 pejabat perlu ditampilkan
  const hasPejabatData =
    profil?.foto_pejabat_utama_url ||
    profil?.sambutan_pejabat_utama ||
    profil?.nama_pejabat_utama;

  const slide2Data = hasPejabatData
    ? {
        fotoPejabatUrl: profil?.foto_pejabat_utama_url ?? null,
        sambutan: profil?.sambutan_pejabat_utama ?? null,
        namaPejabat: profil?.nama_pejabat_utama ?? null,
        jabatanPejabat: profil?.jabatan_pejabat_utama ?? null,
        labelSambutan: tBeranda("sambutanPejabat"),
      }
    : null;

  return (
    <>
      {/* Hero section — slider 2 slide */}
      <HeroSlider
        slide1={{
          namaKecamatan: profil?.nama_kecamatan ?? tMeta("siteName"),
          tagline: tBeranda("tagline"),
          labelSelamatDatang: tBeranda("selamatDatang"),
          papanInformasi: {
            statusBuka,
            jamLayanan,
            aksesCapt,
            labels: {
              papanInformasi: tBeranda("papanInformasi"),
              statusDiperbarui: tBeranda("statusKantorDiperbarui"),
              kantorBuka: tBeranda("kantorBuka"),
              kantorTutup: tBeranda("kantorTutup"),
              jamLayanan: tBeranda("jamLayanan"),
              jamLayananDiperbarui: tBeranda("jamLayananDiperbarui"),
              aksesCepat: tBeranda("aksesCepat"),
            },
          },
        }}
        slide2={slide2Data}
        labels={{
          slideSebelumnya: tBeranda("slideSebelumnya"),
          slideBerikutnya: tBeranda("slideBerikutnya"),
        }}
      />

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
          <div className="border-2 border-primary/20 bg-surface/30 rounded-lg overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-primary/10">
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-surface/50 transition-colors">
              <div className="w-10 h-10 flex items-center justify-center text-secondary mb-2">
                <Users size={24} />
              </div>
              <div className="font-mono text-3xl font-semibold text-primary mb-1">
                {new Intl.NumberFormat("id-ID").format(aggStatistik.totalPenduduk)}
              </div>
              <div className="text-sm font-medium text-text/70 uppercase tracking-wider">{tBeranda("totalPenduduk")}</div>
            </div>
            
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-surface/50 transition-colors">
              <div className="w-10 h-10 flex items-center justify-center text-secondary mb-2">
                <Map size={24} />
              </div>
              <div className="font-mono text-3xl font-semibold text-primary mb-1">
                {new Intl.NumberFormat("id-ID").format(aggStatistik.luasWilayah)}
              </div>
              <div className="text-sm font-medium text-text/70 uppercase tracking-wider">{tBeranda("luasWilayah")} ({tBeranda("satuanLuas")})</div>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-surface/50 transition-colors">
              <div className="w-10 h-10 flex items-center justify-center text-secondary mb-2">
                <School size={24} />
              </div>
              <div className="font-mono text-3xl font-semibold text-primary mb-1">
                {new Intl.NumberFormat("id-ID").format(aggStatistik.fasilitasPendidikan)}
              </div>
              <div className="text-sm font-medium text-text/70 uppercase tracking-wider">{tBeranda("fasilitasPendidikan")}</div>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-2 hover:bg-surface/50 transition-colors">
              <div className="w-10 h-10 flex items-center justify-center text-secondary mb-2">
                <HeartPulse size={24} />
              </div>
              <div className="font-mono text-3xl font-semibold text-primary mb-1">
                {new Intl.NumberFormat("id-ID").format(aggStatistik.fasilitasKesehatan)}
              </div>
              <div className="text-sm font-medium text-text/70 uppercase tracking-wider">{tBeranda("fasilitasKesehatan")}</div>
            </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Featured Article */}
            {beritaTerkini.length > 0 && (
              <div className="lg:col-span-8">
                {(() => {
                  const item = beritaTerkini[0];
                  const judul = isEn && item.judul_en ? item.judul_en : item.judul;
                  const tanggal = new Date(item.created_at).toLocaleDateString(
                    isEn ? "en-GB" : "id-ID",
                    { day: "numeric", month: "long", year: "numeric" }
                  );
                  return (
                    <Link href={`/${locale}/berita/${item.slug}`} className="block group border border-surface rounded-lg overflow-hidden h-full flex flex-col bg-surface/20 hover:border-primary/30 transition-colors">
                      <div className="relative w-full aspect-video sm:aspect-[2/1] bg-surface">
                        {item.gambar_cover_url ? (
                          <Image
                            src={item.gambar_cover_url}
                            alt={judul}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text/20">
                            <span className="font-display text-6xl">{judul.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col justify-center flex-1 bg-background">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge variant="default" className="text-xs uppercase tracking-wider">
                            {item.kategori || tNav("berita")}
                          </Badge>
                          <time dateTime={item.created_at} className="text-xs font-mono text-text/60">
                            {tanggal}
                          </time>
                        </div>
                        <h3 className="font-display font-medium text-text text-2xl leading-tight group-hover:text-primary transition-colors">
                          {judul}
                        </h3>
                      </div>
                    </Link>
                  );
                })()}
              </div>
            )}
            
            {/* Side Articles */}
            {beritaTerkini.length > 1 && (
              <div className="lg:col-span-4 flex flex-col divide-y divide-surface border-y lg:border-y-0 lg:border-l border-surface lg:pl-6">
                {beritaTerkini.slice(1).map((item) => {
                  const judul = isEn && item.judul_en ? item.judul_en : item.judul;
                  const tanggal = new Date(item.created_at).toLocaleDateString(
                    isEn ? "en-GB" : "id-ID",
                    { day: "numeric", month: "long", year: "numeric" }
                  );
                  return (
                    <Link key={item.id} href={`/${locale}/berita/${item.slug}`} className="py-6 first:pt-0 lg:first:pt-0 last:pb-0 group flex flex-col h-full justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                          {item.kategori || tNav("berita")}
                        </Badge>
                        <time dateTime={item.created_at} className="text-xs font-mono text-text/50">
                          {tanggal}
                        </time>
                      </div>
                      <h3 className="font-medium text-text text-base leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                        {judul}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pb-8">
            {potensiUnggulan.map((item, index) => {
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const deskripsi = isEn && item.deskripsi_en ? item.deskripsi_en : item.deskripsi;
              const katId = item.kategori as "ekonomi" | "wisata" | "pengolahan";
              const isMiddle = index === 1;

              return (
                <Link 
                  key={item.id} 
                  href={`/${locale}/potensi?k=${katId}`} 
                  className={`block h-full group ${isMiddle ? 'md:translate-y-8' : ''}`}
                >
                  <div className="h-full flex flex-col border border-surface bg-background hover:border-primary/30 transition-colors overflow-hidden rounded">
                    <div className="relative w-full aspect-square sm:h-56 sm:aspect-auto bg-surface overflow-hidden">
                      {item.gambar_url ? (
                        <Image
                          src={item.gambar_url}
                          alt={judul}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[0.2] group-hover:grayscale-0"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text/20 bg-surface/50">
                          <span className="font-display text-4xl">{judul.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge variant={potensiBadgeMap[katId] || "default"} className="shadow-sm border-white/20 bg-background/95 backdrop-blur font-mono uppercase tracking-wider text-[10px]">
                          {tPotensi(`kategori.${katId}`)}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1 border-t border-surface/50">
                      <h3 className="font-display text-lg font-semibold text-primary mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                        {judul}
                      </h3>
                      {item.lokasi && (
                        <div className="flex items-center gap-1.5 text-xs text-text/60 mb-3 font-mono">
                          <MapPin size={14} className="flex-shrink-0 text-secondary" />
                          <span className="truncate">{item.lokasi}</span>
                        </div>
                      )}
                      <p className="text-sm text-text/70 line-clamp-3 leading-relaxed">
                        {deskripsi}
                      </p>
                    </div>
                  </div>
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
          <ul className="flex flex-col border-t-2 border-primary/10" role="list">
            {infos.map((item) => {
              const judul = isEn && item.judul_en ? item.judul_en : item.judul;
              const kat = item.kategori as keyof typeof kategoriBadge;
              const tanggal = new Date(item.created_at).toLocaleDateString(
                isEn ? "en-GB" : "id-ID",
                { day: "2-digit", month: "short", year: "numeric" }
              );
              return (
                <li key={item.id}>
                  <Link href={`/${locale}/informasi/${item.slug}`} className="group block border-b border-surface hover:bg-surface/30 transition-colors">
                    <div className="px-4 py-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                      <time
                        dateTime={item.created_at}
                        className="text-sm font-mono font-medium text-secondary whitespace-nowrap w-28 shrink-0"
                      >
                        {tanggal}
                      </time>
                      <div className="shrink-0 w-32">
                        <Badge variant={kategoriBadge[kat] ?? "default"} className="font-mono text-[10px] uppercase tracking-wider">
                          {kategoriLabel[kat] ?? kat}
                        </Badge>
                      </div>
                      <p className="font-medium text-text text-base leading-snug flex-1 group-hover:text-primary transition-colors">
                        {judul}
                      </p>
                      <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0">
                        <TrendingUp size={18} className="rotate-90" />
                      </div>
                    </div>
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
        <div className="border border-primary/20 bg-surface/20 rounded-lg overflow-hidden">
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 lg:divide-x divide-primary/10" role="list">
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
                <li key={item.href} className="group">
                  <Link href={item.href} className="block h-full p-6 hover:bg-surface/50 transition-colors flex flex-col items-start">
                    <div className="w-10 h-10 mb-4 rounded bg-background border border-surface flex items-center justify-center group-hover:border-primary/30 group-hover:text-primary transition-colors text-secondary">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <h3 className="font-medium text-primary mb-2 text-sm">{item.label}</h3>
                    <p className="text-xs text-text/60 leading-relaxed flex-1">{item.desc}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
