import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

interface FooterProps {
  locale: string;
  profil?: {
    nama_kecamatan?: string | null;
    alamat?: string | null;
    telepon?: string | null;
    email?: string | null;
    jam_operasional?: string | null;
  } | null;
}

export async function Footer({ locale, profil }: FooterProps) {
  const tFooter = await getTranslations({ locale, namespace: "footer" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  const year = new Date().getFullYear();
  const nama = profil?.nama_kecamatan ?? tMeta("siteName");

  const navLinks = [
    { label: tNav("beranda"), href: "" },
    { label: tNav("profil"), href: "/profil" },
    { label: tNav("standarPelayanan"), href: "/standar-pelayanan" },
    { label: tNav("informasiPublik"), href: "/informasi" },
    { label: tNav("ppid"), href: "/profil/ppid" },
    { label: tNav("kontak"), href: "/kontak" },
  ];

  return (
    <footer className="bg-primary text-white/80 mt-auto">
      <SectionDivider className="mb-0" />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Kolom 1 — Identitas */}
          <div className="space-y-3">
            <h2 className="font-display text-white font-semibold text-base">
              {nama}
            </h2>
            <div className="space-y-2 text-sm">
              {profil?.alamat ? (
                <p className="flex gap-2">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5 text-accent" aria-hidden="true" />
                  <span>{profil.alamat}</span>
                </p>
              ) : (
                <p className="flex gap-2 opacity-50">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="italic">{tFooter("placeholderAlamat")}</span>
                </p>
              )}
              {profil?.telepon && (
                <p className="flex gap-2">
                  <Phone size={14} className="flex-shrink-0 mt-0.5 text-accent" aria-hidden="true" />
                  <a href={`tel:${profil.telepon}`} className="hover:text-white transition-colors font-mono">
                    {profil.telepon}
                  </a>
                </p>
              )}
              {profil?.email && (
                <p className="flex gap-2">
                  <Mail size={14} className="flex-shrink-0 mt-0.5 text-accent" aria-hidden="true" />
                  <a href={`mailto:${profil.email}`} className="hover:text-white transition-colors">
                    {profil.email}
                  </a>
                </p>
              )}
              {profil?.jam_operasional && (
                <p className="flex gap-2">
                  <Clock size={14} className="flex-shrink-0 mt-0.5 text-accent" aria-hidden="true" />
                  <span className="font-mono">{profil.jam_operasional}</span>
                </p>
              )}
            </div>
          </div>

          {/* Kolom 2 — Navigasi cepat */}
          <nav aria-label={tFooter("ariaNavigasiFooter")}>
            <h3 className="text-white font-medium text-sm mb-3">{tFooter("navigasi")}</h3>
            <ul className="space-y-2 text-sm" role="list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${locale}${link.href}`}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Kolom 3 — Info tambahan */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">{tFooter("informasi")}</h3>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <a
                  href="https://lapor.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  SP4N-LAPOR!
                </a>
              </li>
              <li>
                <Link href={`/${locale}/profil/ppid`} className="hover:text-white transition-colors">
                  {tFooter("keterbukaanInformasi")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 text-xs text-white/40 font-mono">
          <p>{tFooter("hakCipta", { year, nama })}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
            <p>{tFooter("dikelola", { nama })}</p>
            <p className="hidden sm:block">•</p>
            <p>
              {tFooter("pengembang")}{" "}
              <a 
                href="https://www.instagram.com/k_n_pgz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors underline underline-offset-2"
              >
                @k_n_pgz
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
