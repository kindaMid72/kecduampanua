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
    penduduk_usia_0_14: number | null;
    penduduk_usia_15_64: number | null;
    penduduk_usia_65_ke_atas: number | null;
    penduduk_laki_laki: number | null;
    penduduk_perempuan: number | null;
    jumlah_murid_sd_smp: number | null;
    jumlah_guru_sd_smp: number | null;
    penduduk_usia_sekolah: number | null;
    jumlah_sekolah: number | null;
    jumlah_rumah_sakit: number | null;
    jumlah_puskesmas: number | null;
    jumlah_posyandu: number | null;
    jumlah_klinik_apotek: number | null;
    luas_wilayah_km2: number | null;
    jarak_ke_ibukota_km: number | null;
    produksi_panen_ton: number | null;
    luas_panen_ha: number | null;
    jumlah_toko_minimarket: number | null;
    tangkapan_ikan_ton: number | null;
    jumlah_nelayan: number | null;
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
          .select(`
            id, nama_desa_kelurahan, jumlah_penduduk, tahun_data,
            penduduk_usia_0_14, penduduk_usia_15_64, penduduk_usia_65_ke_atas, penduduk_laki_laki, penduduk_perempuan,
            jumlah_murid_sd_smp, jumlah_guru_sd_smp, penduduk_usia_sekolah, jumlah_sekolah,
            jumlah_rumah_sakit, jumlah_puskesmas, jumlah_posyandu, jumlah_klinik_apotek,
            luas_wilayah_km2, jarak_ke_ibukota_km,
            produksi_panen_ton, luas_panen_ha, jumlah_toko_minimarket, tangkapan_ikan_ton, jumlah_nelayan
          `)
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
        <div className="border border-primary/20 bg-surface/10 p-6 sm:p-10 flex flex-col md:flex-row gap-10 md:gap-16 relative before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:bg-primary/20">
          <div className="flex-1">
            <h3 className="font-mono text-xs uppercase tracking-widest text-secondary mb-4">{tProfil("visi")}</h3>
            {visi ? (
              <p className="text-primary font-display text-xl sm:text-2xl leading-relaxed italic">"{visi}"</p>
            ) : (
              <Placeholder pesan={tProfil("visiPlaceholder")} />
            )}
          </div>
          <div className="flex-1 md:border-l border-primary/10 md:pl-16">
            <h3 className="font-mono text-xs uppercase tracking-widest text-secondary mb-4">{tProfil("misi")}</h3>
            {misi ? (
              <div className="text-text/80 leading-relaxed whitespace-pre-line prose prose-sm max-w-none marker:text-primary marker:font-mono">
                {misi}
              </div>
            ) : (
              <Placeholder pesan={tProfil("misiPlaceholder")} />
            )}
          </div>
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
          <div className="border border-primary/20 bg-primary/10 rounded overflow-hidden">
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px]"
              role="list"
            >
              {struktur.map((pejabat) => (
                <li key={pejabat.id} className="bg-surface/20 hover:bg-surface/40 transition-colors">
                  <div className="p-6 text-center h-full flex flex-col items-center justify-center">
                    <div className="mb-4 h-28 w-24 rounded-sm border border-surface bg-background overflow-hidden flex items-center justify-center shadow-sm">
                      {pejabat.foto_url ? (
                        <Image
                          src={pejabat.foto_url}
                          alt={tProfil("fotoAlt", { nama: pejabat.nama_pejabat })}
                          width={96}
                          height={112}
                          unoptimized
                          className="object-cover w-full h-full grayscale-[0.2]"
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
                    <p className="text-[10px] font-mono text-secondary mt-2 border-t border-primary/10 pt-2 w-full uppercase tracking-wider">
                      {pejabat.jabatan}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      <section
        id="asn"
        className="max-w-6xl mx-auto px-4 py-10"
        aria-labelledby="asn-heading"
      >
        <h2 id="asn-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          {tProfil("jumlahAsn")}
        </h2>
        {profil?.jumlah_asn != null ? (
          <div className="bg-primary text-background py-16 rounded-[var(--radius-card)] text-center flex flex-col items-center justify-center border-y-4 border-accent/80">
            <div className="flex items-baseline gap-4 justify-center">
              <span className="font-display text-6xl md:text-8xl font-semibold text-accent">
                {profil.jumlah_asn}
              </span>
              <span className="text-background/80 text-lg md:text-xl font-mono uppercase tracking-wider">{tProfil("asnSuffix")}</span>
            </div>
          </div>
        ) : (
          <Placeholder pesan={tProfil("asnPlaceholder")} />
        )}
      </section>

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
          <div className="space-y-8">
            {/* Aggregate Kecamatan */}
            {(() => {
              const latestYear = Math.max(...statistik.map(s => s.tahun_data));
              const latestStats = statistik.filter(s => s.tahun_data === latestYear);
              
              const kecStat = latestStats.reduce((acc, curr) => ({
                jumlah_penduduk: (acc.jumlah_penduduk || 0) + (curr.jumlah_penduduk || 0),
                penduduk_usia_0_14: (acc.penduduk_usia_0_14 || 0) + (curr.penduduk_usia_0_14 || 0),
                penduduk_usia_15_64: (acc.penduduk_usia_15_64 || 0) + (curr.penduduk_usia_15_64 || 0),
                penduduk_usia_65_ke_atas: (acc.penduduk_usia_65_ke_atas || 0) + (curr.penduduk_usia_65_ke_atas || 0),
                penduduk_laki_laki: (acc.penduduk_laki_laki || 0) + (curr.penduduk_laki_laki || 0),
                penduduk_perempuan: (acc.penduduk_perempuan || 0) + (curr.penduduk_perempuan || 0),
                jumlah_murid_sd_smp: (acc.jumlah_murid_sd_smp || 0) + (curr.jumlah_murid_sd_smp || 0),
                jumlah_guru_sd_smp: (acc.jumlah_guru_sd_smp || 0) + (curr.jumlah_guru_sd_smp || 0),
                jumlah_puskesmas: (acc.jumlah_puskesmas || 0) + (curr.jumlah_puskesmas || 0),
                jumlah_posyandu: (acc.jumlah_posyandu || 0) + (curr.jumlah_posyandu || 0),
                jumlah_klinik_apotek: (acc.jumlah_klinik_apotek || 0) + (curr.jumlah_klinik_apotek || 0),
                jumlah_rumah_sakit: (acc.jumlah_rumah_sakit || 0) + (curr.jumlah_rumah_sakit || 0),
                luas_wilayah_km2: (acc.luas_wilayah_km2 || 0) + (curr.luas_wilayah_km2 || 0),
                produksi_panen_ton: (acc.produksi_panen_ton || 0) + (curr.produksi_panen_ton || 0),
                luas_panen_ha: (acc.luas_panen_ha || 0) + (curr.luas_panen_ha || 0),
                tangkapan_ikan_ton: (acc.tangkapan_ikan_ton || 0) + (curr.tangkapan_ikan_ton || 0),
                jumlah_nelayan: (acc.jumlah_nelayan || 0) + (curr.jumlah_nelayan || 0),
              }), {} as Record<string, number>);

              return (
                <>
                  <InsightCard 
                    title="Total Kecamatan" 
                    tahunData={latestYear} 
                    stat={kecStat} 
                    isHighlight={true} 
                  />
                  
                  <div className="pt-6">
                    <details className="group border border-surface rounded-xl overflow-hidden bg-background">
                      <summary className="font-display text-lg font-semibold text-primary px-5 py-4 cursor-pointer flex justify-between items-center hover:bg-surface/30 transition-colors">
                        Rincian per Desa/Kelurahan
                        <span className="text-text/50 transform transition-transform group-open:rotate-180">
                          ▼
                        </span>
                      </summary>
                      <div className="p-5 border-t border-surface space-y-6 bg-surface/10">
                        {statistik.map(stat => (
                          <InsightCard 
                            key={stat.id} 
                            title={stat.nama_desa_kelurahan} 
                            tahunData={stat.tahun_data} 
                            stat={stat as any} 
                          />
                        ))}
                      </div>
                    </details>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </section>
    </>
  );
}

function InsightCard({ title, tahunData, stat, isHighlight = false }: { title: string, tahunData: number, stat: any, isHighlight?: boolean }) {
  // Kalkulasi Insight
  const penduduk = Number(stat.jumlah_penduduk) || 0;
  const p0_14 = Number(stat.penduduk_usia_0_14) || 0;
  const p15_64 = Number(stat.penduduk_usia_15_64) || 0;
  const p65 = Number(stat.penduduk_usia_65_ke_atas) || 0;
  const depRatio = p15_64 > 0 ? ((p0_14 + p65) / p15_64) * 100 : 0;
  
  const laki = Number(stat.penduduk_laki_laki) || 0;
  const perempuan = Number(stat.penduduk_perempuan) || 0;
  const sexRatio = perempuan > 0 ? (laki / perempuan) * 100 : 0;

  const murid = Number(stat.jumlah_murid_sd_smp) || 0;
  const guru = Number(stat.jumlah_guru_sd_smp) || 0;
  const muridGuru = guru > 0 ? (murid / guru) : 0;

  const luas = Number(stat.luas_wilayah_km2) || 0;
  const kepadatan = luas > 0 ? (penduduk / luas) : 0;

  const panenTon = Number(stat.produksi_panen_ton) || 0;
  const panenHa = Number(stat.luas_panen_ha) || 0;
  const yieldTani = panenHa > 0 ? (panenTon / panenHa) : 0;

  const rs = Number(stat.jumlah_rumah_sakit) || 0;
  const pkm = Number(stat.jumlah_puskesmas) || 0;
  const posyandu = Number(stat.jumlah_posyandu) || 0;
  const klinik = Number(stat.jumlah_klinik_apotek) || 0;
  const totalFaskes = rs + pkm + posyandu + klinik;
  const faskesBurden = totalFaskes > 0 ? (penduduk / totalFaskes) : 0;

  const wrapperClass = isHighlight 
    ? "border-2 border-primary rounded overflow-hidden bg-background"
    : "border border-surface rounded overflow-hidden bg-background";
    
  const headerClass = isHighlight
    ? "bg-primary text-background px-5 py-4 border-b border-primary flex justify-between items-center flex-wrap gap-2"
    : "bg-surface/50 px-5 py-3 border-b border-surface flex justify-between items-center flex-wrap gap-2";

  return (
    <div className={wrapperClass}>
      <div className={headerClass}>
        <h3 className={`font-display text-xl font-semibold ${isHighlight ? 'text-background' : 'text-primary'}`}>{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-sm border font-mono ${isHighlight ? 'text-primary font-medium bg-background border-background' : 'text-text/70 bg-background border-surface'}`}>
          Tahun Data: {tahunData}
        </span>
      </div>
      
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Penduduk & Kepadatan */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-text/60 uppercase tracking-widest">Total Penduduk</span>
          <span className="text-2xl font-mono font-semibold text-text">
            {stat.jumlah_penduduk ? new Intl.NumberFormat("id-ID").format(stat.jumlah_penduduk) : "-"}
          </span>
          {kepadatan > 0 && (
            <span className="text-xs text-text/50 font-mono">{new Intl.NumberFormat("id-ID").format(Math.round(kepadatan))} jiwa/km²</span>
          )}
        </div>

        {/* Dependency Ratio */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-text/60 uppercase tracking-widest">Dependency Ratio</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-mono font-semibold text-text">
              {depRatio > 0 ? depRatio.toFixed(1) : "-"}
            </span>
            {depRatio > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${depRatio > 50 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {depRatio > 50 ? "Beban Tinggi" : "Bonus Demografi"}
              </span>
            )}
          </div>
        </div>

        {/* Sex Ratio */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-text/60 uppercase tracking-widest">Sex Ratio</span>
          <span className="text-2xl font-mono font-semibold text-text">
            {sexRatio > 0 ? sexRatio.toFixed(0) : "-"}
          </span>
          {sexRatio > 0 && (
            <span className="text-xs text-text/50 font-mono">L per 100 P</span>
          )}
        </div>

        {/* Pendidikan */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-text/60 uppercase tracking-widest">Rasio Murid-Guru</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-mono font-semibold text-text">
              {muridGuru > 0 ? muridGuru.toFixed(0) : "-"}
            </span>
            {muridGuru > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${muridGuru > 30 ? 'bg-red-100 text-red-700' : 'bg-surface text-text/70'}`}>
                {muridGuru > 30 ? "Overload" : "Ideal"}
              </span>
            )}
          </div>
        </div>

        {/* Kesehatan (Faskes Burden) */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-text/60 uppercase tracking-widest">Beban Faskes</span>
          <span className="text-2xl font-mono font-semibold text-text">
            {faskesBurden > 0 ? new Intl.NumberFormat("id-ID").format(Math.round(faskesBurden)) : "-"}
          </span>
          {faskesBurden > 0 && (
            <span className="text-xs text-text/50 font-mono">Warga / faskes</span>
          )}
        </div>

        {/* Pertanian */}
        {(yieldTani > 0 || (stat.luas_panen_ha && stat.luas_panen_ha > 0)) && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-text/60 uppercase tracking-widest">Yield Pertanian</span>
            <span className="text-2xl font-mono font-semibold text-text">
              {yieldTani > 0 ? yieldTani.toFixed(1) : "-"}
            </span>
            <span className="text-xs text-text/50 font-mono">Ton / Hektar</span>
          </div>
        )}
        
        {/* Kelautan (Tangkapan Ikan) */}
        {(stat.tangkapan_ikan_ton && stat.tangkapan_ikan_ton > 0) ? (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-text/60 uppercase tracking-widest">Tangkapan Ikan</span>
            <span className="text-2xl font-mono font-semibold text-text">
              {new Intl.NumberFormat("id-ID").format(stat.tangkapan_ikan_ton)} Ton
            </span>
            {(stat.jumlah_nelayan && stat.jumlah_nelayan > 0) ? (
              <span className="text-xs text-text/50 font-mono">Oleh {stat.jumlah_nelayan} Nelayan</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
