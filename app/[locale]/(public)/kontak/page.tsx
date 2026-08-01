import { createClient } from "@/lib/supabase/server";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Card } from "@/components/ui/Card";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontak — Kecamatan Duampanua",
  description:
    "Alamat, nomor telepon, email, dan jam operasional Kantor Kecamatan Duampanua.",
};

export const revalidate = false;

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        size={18}
        className="flex-shrink-0 mt-0.5 text-accent"
        aria-hidden="true"
      />
      <div>
        <p className="text-xs font-mono text-text/50 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

function Placeholder({ pesan }: { pesan: string }) {
  return <p className="text-sm text-text/50 italic">{pesan}</p>;
}

export default async function KontakPage() {
  let profil = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profil_kecamatan")
      .select("nama_kecamatan, alamat, telepon, email, jam_operasional, koordinat_lat, koordinat_lng")
      .limit(1)
      .single();
    profil = data;
  } catch {
    // Graceful
  }

  const hasCoords = profil?.koordinat_lat && profil?.koordinat_lng;
  const mapUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${profil?.koordinat_lat}&mlon=${profil?.koordinat_lng}#map=15/${profil?.koordinat_lat}/${profil?.koordinat_lng}`
    : null;
  const embedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(profil?.koordinat_lng ?? 0) - 0.01}%2C${(profil?.koordinat_lat ?? 0) - 0.01}%2C${(profil?.koordinat_lng ?? 0) + 0.01}%2C${(profil?.koordinat_lat ?? 0) + 0.01}&layer=mapnik&marker=${profil?.koordinat_lat}%2C${profil?.koordinat_lng}`
    : null;

  return (
    <>
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <CategoryLabel label="Hubungi Kami" className="mb-1 block" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary">
          Kontak
        </h1>
      </section>

      <SectionDivider />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informasi kontak */}
          <Card padding="lg" className="space-y-6">
            <h2 className="font-display text-xl font-semibold text-primary">
              {profil?.nama_kecamatan ?? "Kecamatan Duampanua"}
            </h2>

            <InfoRow icon={MapPin} label="Alamat">
              {profil?.alamat ? (
                <p className="text-text/80 text-sm leading-relaxed">{profil.alamat}</p>
              ) : (
                <Placeholder pesan="Alamat sedang dilengkapi" />
              )}
            </InfoRow>

            <InfoRow icon={Phone} label="Telepon">
              {profil?.telepon ? (
                <a
                  href={`tel:${profil.telepon}`}
                  className="text-secondary hover:text-primary transition-colors font-mono text-sm"
                >
                  {profil.telepon}
                </a>
              ) : (
                <Placeholder pesan="Nomor telepon sedang dilengkapi" />
              )}
            </InfoRow>

            <InfoRow icon={Mail} label="Email">
              {profil?.email ? (
                <a
                  href={`mailto:${profil.email}`}
                  className="text-secondary hover:text-primary transition-colors text-sm"
                >
                  {profil.email}
                </a>
              ) : (
                <Placeholder pesan="Email sedang dilengkapi" />
              )}
            </InfoRow>

            <InfoRow icon={Clock} label="Jam Operasional">
              {profil?.jam_operasional ? (
                <p className="text-text/80 text-sm font-mono">{profil.jam_operasional}</p>
              ) : (
                <Placeholder pesan="Jam operasional sedang dilengkapi" />
              )}
            </InfoRow>
          </Card>

          {/* Peta OpenStreetMap */}
          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-primary">
              Lokasi di Peta
            </h2>
            {embedUrl ? (
              <>
                <div className="rounded-[var(--radius-card)] overflow-hidden border border-surface">
                  <iframe
                    title="Lokasi Kantor Kecamatan Duampanua"
                    src={embedUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Buka di OpenStreetMap
                  </a>
                )}
              </>
            ) : (
              <Card padding="lg" className="text-center h-[300px] flex items-center justify-center">
                <div>
                  <MapPin size={32} className="text-text/20 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-text/50 italic">
                    Koordinat lokasi sedang dilengkapi
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
