import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { CategoryLabel } from "@/components/ui/CategoryLabel";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Card } from "@/components/ui/Card";
import { MapPin, Phone, Mail, Clock, ExternalLink, MessageSquareWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("kontakTitle"),
    description: t("kontakDesc"),
  };
}

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

export default async function KontakPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tKontak = await getTranslations({ locale, namespace: "kontak" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

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
    ? `https://www.google.com/maps/search/?api=1&query=${profil?.koordinat_lat},${profil?.koordinat_lng}`
    : `https://www.google.com/maps/search/?api=1&query=Kantor+Camat+Duampanua+Pinrang`;
  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${profil?.koordinat_lat},${profil?.koordinat_lng}&z=15&output=embed`
    : `https://maps.google.com/maps?q=Kantor+Camat+Duampanua+Pinrang&z=15&output=embed`;

  return (
    <>
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <CategoryLabel label={tKontak("hubungiKami")} className="mb-1 block" />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary">
          {tKontak("title")}
        </h1>
      </section>

      <SectionDivider />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informasi kontak */}
          <Card padding="lg" className="space-y-6">
            <h2 className="font-display text-xl font-semibold text-primary">
              {profil?.nama_kecamatan ?? tMeta("siteName")}
            </h2>

            <InfoRow icon={MapPin} label={tKontak("alamat")}>
              {profil?.alamat ? (
                <p className="text-text/80 text-sm leading-relaxed">{profil.alamat}</p>
              ) : (
                <Placeholder pesan={tKontak("placeholderAlamat")} />
              )}
            </InfoRow>

            <InfoRow icon={Phone} label={tKontak("telepon")}>
              {profil?.telepon ? (
                <a
                  href={`tel:${profil.telepon}`}
                  className="text-secondary hover:text-primary transition-colors font-mono text-sm"
                >
                  {profil.telepon}
                </a>
              ) : (
                <Placeholder pesan={tKontak("placeholderTelepon")} />
              )}
            </InfoRow>

            <InfoRow icon={Mail} label={tKontak("email")}>
              {profil?.email ? (
                <a
                  href={`mailto:${profil.email}`}
                  className="text-secondary hover:text-primary transition-colors text-sm"
                >
                  {profil.email}
                </a>
              ) : (
                <Placeholder pesan={tKontak("placeholderEmail")} />
              )}
            </InfoRow>

            <InfoRow icon={Clock} label={tKontak("jamOperasional")}>
              {profil?.jam_operasional ? (
                <p className="text-text/80 text-sm font-mono">{profil.jam_operasional}</p>
              ) : (
                <Placeholder pesan={tKontak("placeholderJam")} />
              )}
            </InfoRow>

            <div className="pt-6 border-t border-surface mt-6">
              <h3 className="font-display font-medium text-lg mb-2 flex items-center gap-2 text-primary">
                <MessageSquareWarning size={18} />
                {tKontak("layananPengaduan")}
              </h3>
              <p className="text-sm text-text/70 mb-4 leading-relaxed">
                {tKontak("pengaduanDesc")}
              </p>
              <Link 
                href={`/${locale}/kontak/pengaduan`}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-primary text-white rounded-[var(--radius-button)] text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                {tKontak("buatLaporan")}
              </Link>
            </div>
          </Card>

          {/* Peta Google Maps */}
          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-primary">
              {tKontak("peta")}
            </h2>
            {embedUrl ? (
              <>
                <div className="rounded-[var(--radius-card)] overflow-hidden border border-surface">
                  <iframe
                    title={tKontak("iframeTitle")}
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
                    {tKontak("bukaPeta")}
                  </a>
                )}
              </>
            ) : (
              <Card padding="lg" className="text-center h-[300px] flex items-center justify-center">
                <div>
                  <MapPin size={32} className="text-text/20 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-text/50 italic">
                    {tKontak("placeholderPeta")}
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
