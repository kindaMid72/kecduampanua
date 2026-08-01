import { createClient } from "@/lib/supabase/server";
import { PapanInformasiPanel } from "@/components/ui/PapanInformasiPanel";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import Link from "next/link";
import { FileText, Phone, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beranda — Kecamatan Duampanua",
  description:
    "Website resmi Kecamatan Duampanua. Informasi layanan publik, pengumuman, dan profil kecamatan.",
};

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

const kategoriLabel: Record<string, string> = {
  pengumuman: "Pengumuman",
  kegiatan: "Kegiatan",
  jadwal_rapat: "Jadwal Rapat",
};

export default async function Beranda({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let profil = null;
  let infos: Record<string, unknown>[] = [];

  try {
    const supabase = await createClient();

    const [profilRes, infoRes] = await Promise.all([
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
    ]);

    profil = profilRes.data;
    infos = infoRes.data ?? [];
  } catch {
    // Graceful — tampil dengan placeholder
  }

  // Parse jam operasional sederhana untuk status buka
  // Format yang diharapkan: "Senin–Jumat, 08.00–16.00 WIB"
  // Untuk Fase 1, status buka null (belum ada logika waktu real-time)
  const jamLayanan = profil?.jam_operasional
    ? { hari: "Senin – Jumat", jam: profil.jam_operasional }
    : null;

  const aksesCapt = [
    { label: "Standar Pelayanan", href: `/${locale}/standar-pelayanan` },
    { label: "Informasi Publik", href: `/${locale}/informasi` },
    { label: "Kontak", href: `/${locale}/kontak` },
  ];

  return (
    <>
      {/* Hero section */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="mb-3">
          <CategoryLabel label="Selamat Datang" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary mb-2">
          {profil?.nama_kecamatan ?? "Kecamatan Duampanua"}
        </h1>
        <p className="text-text/60 text-base mb-8 max-w-xl">
          Pelayanan publik yang transparan dan mudah dijangkau
        </p>

        {/* Papan Informasi — signature element, hanya di Beranda */}
        <PapanInformasiPanel
          statusBuka={null}
          jamLayanan={jamLayanan}
          aksesCapt={aksesCapt}
        />
      </section>

      <SectionDivider className="mx-4 sm:mx-8" />

      {/* Informasi Terbaru */}
      <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="info-terbaru-heading">
        <div className="flex items-center justify-between mb-6">
          <div>
            <CategoryLabel label="Terbaru" className="mb-1 block" />
            <h2 id="info-terbaru-heading" className="font-display text-2xl font-semibold text-primary">
              Informasi Publik
            </h2>
          </div>
          <Link
            href={`/${locale}/informasi`}
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            Lihat semua →
          </Link>
        </div>

        {infos.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-text/50 italic text-sm">
              Informasi belum tersedia. Konten akan muncul di sini setelah diterbitkan oleh staf.
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
        <CategoryLabel label="Layanan" className="mb-1 block" />
        <h2 id="akses-cepat-heading" className="font-display text-2xl font-semibold text-primary mb-6">
          Akses Cepat
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="list">
          {[
            {
              label: "Standar Pelayanan",
              desc: "Prosedur, syarat, dan estimasi waktu layanan administrasi",
              href: `/${locale}/standar-pelayanan`,
              icon: FileText,
            },
            {
              label: "Informasi Publik",
              desc: "Pengumuman, kegiatan, dan jadwal rapat kecamatan",
              href: `/${locale}/informasi`,
              icon: BookOpen,
            },
            {
              label: "Kontak",
              desc: "Alamat, nomor telepon, dan jam operasional kantor",
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
