import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, FileText, Settings } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Layout.tsx akan menangani redirect ke login, jadi aman mengembalikan null di sini
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama_lengkap, role")
    .eq("id", user.id)
    .single();

  // Statistik ringkas
  const [{ count: jumlahInfo }, { count: jumlahLayanan }] = await Promise.all([
    supabase
      .from("informasi_publik")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("layanan")
      .select("*", { count: "exact", head: true })
      .eq("status", "aktif"),
  ]);

  const isSuperAccount = profile?.role === "super_account";

  return (
    <div className="max-w-4xl space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-xs font-mono text-text/40 uppercase tracking-wide mb-1">
          Selamat datang
        </p>
        <h1 className="font-display text-2xl font-semibold text-primary">
          {profile?.nama_lengkap ?? "—"}
        </h1>
        <div className="mt-1">
          <Badge variant={isSuperAccount ? "warning" : "info"}>
            {isSuperAccount ? "Pengelola" : "Staf"}
          </Badge>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md">
          <p className="text-xs font-mono text-text/50 uppercase tracking-wide mb-1">
            Informasi Diterbitkan
          </p>
          <p className="font-display text-3xl font-semibold text-primary">
            {jumlahInfo ?? 0}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-mono text-text/50 uppercase tracking-wide mb-1">
            Layanan Aktif
          </p>
          <p className="font-display text-3xl font-semibold text-primary">
            {jumlahLayanan ?? 0}
          </p>
        </Card>
      </div>

      {/* Aksi cepat */}
      <div>
        <h2 className="font-medium text-text mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Tambah Informasi",
              href: "/admin/informasi-publik/tambah",
              icon: BookOpen,
              desc: "Terbitkan pengumuman, kegiatan, atau jadwal rapat",
            },
            {
              label: "Kelola Layanan",
              href: "/admin/standar-pelayanan",
              icon: FileText,
              desc: "Atur standar pelayanan dan prosedur",
            },
            {
              label: "Profil & Kontak",
              href: "/admin/profil",
              icon: Settings,
              desc: "Perbarui info kantor, kontak, dan jam operasional",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card interactive padding="md" className="h-full">
                  <Icon size={20} className="text-secondary mb-2" aria-hidden="true" />
                  <p className="font-medium text-text text-sm">{item.label}</p>
                  <p className="text-xs text-text/50 mt-0.5">{item.desc}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
