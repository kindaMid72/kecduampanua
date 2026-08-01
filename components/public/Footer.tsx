import Link from "next/link";
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

export function Footer({ locale, profil }: FooterProps) {
  const year = new Date().getFullYear();
  const nama = profil?.nama_kecamatan ?? "Kecamatan Duampanua";

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
                  <span className="italic">Alamat sedang dilengkapi</span>
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
          <nav aria-label="Navigasi footer">
            <h3 className="text-white font-medium text-sm mb-3">Navigasi</h3>
            <ul className="space-y-2 text-sm" role="list">
              {[
                { label: "Beranda", href: "" },
                { label: "Profil Kecamatan", href: "/profil" },
                { label: "Standar Pelayanan", href: "/standar-pelayanan" },
                { label: "Informasi Publik", href: "/informasi" },
                { label: "PPID", href: "/profil/ppid" },
                { label: "Kontak", href: "/kontak" },
              ].map((link) => (
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
            <h3 className="text-white font-medium text-sm mb-3">Informasi</h3>
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
                  Keterbukaan Informasi (PPID)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-white/40 font-mono">
          <p>© {year} {nama}. Seluruh hak dilindungi.</p>
          <p>Dikelola oleh {nama}</p>
        </div>
      </div>
    </footer>
  );
}
