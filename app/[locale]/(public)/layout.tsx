import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav" });

  // Fetch data profil untuk footer (graceful — jangan crash jika gagal)
  let profil = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profil_kecamatan")
      .select("nama_kecamatan, alamat, telepon, email, jam_operasional")
      .limit(1)
      .single();
    profil = data;
  } catch {
    // Supabase belum dikonfigurasi atau belum ada data — footer tampil dengan placeholder
  }

  return (
    <>
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-button focus:bg-primary focus:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {tNav("skipLink")}
      </a>
      <Navbar locale={locale} />
      <main id="konten-utama" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      <Footer locale={locale} profil={profil} />
    </>
  );
}
