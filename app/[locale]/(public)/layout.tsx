import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { createClient } from "@/lib/supabase/server";

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = await params;

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
      <Navbar locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} profil={profil} />
    </>
  );
}
