import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LayoutDashboard, FileText, BookOpen, Users, Settings, LogOut, UserCog, Newspaper, Map, BarChart, FileBox, MessageSquareWarning } from "lucide-react";
import { SectionDivider } from "@/components/ui/SectionDivider";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Informasi Publik", href: "/admin/informasi-publik", icon: BookOpen },
  { label: "Berita", href: "/admin/berita", icon: Newspaper },
  { label: "Standar Pelayanan", href: "/admin/standar-pelayanan", icon: FileText },
  { label: "Potensi Daerah", href: "/admin/potensi-daerah", icon: Map },
  { label: "Data Statistik", href: "/admin/data-statistik", icon: BarChart },
  { label: "Edaran Dokumen", href: "/admin/edaran-dokumen", icon: FileBox },
  { label: "Pengaduan", href: "/admin/pengaduan", icon: MessageSquareWarning },
  { label: "Profil & Kontak", href: "/admin/profil", icon: Settings },
  { label: "Pengaturan Akun", href: "/admin/pengaturan-akun", icon: UserCog },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama_lengkap, role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status === "nonaktif") {
    await supabase.auth.signOut();
    redirect("/admin/login?error=nonaktif");
  }

  const isSuperAccount = profile.role === "super_account";
  const allNavItems = isSuperAccount
    ? [...navItems, { label: "Kelola Pengguna", href: "/admin/pengguna", icon: Users }]
    : navItems;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar mobile */}
      <header className="bg-primary text-white lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-display font-semibold text-sm">Panel Admin</span>
          <span className="text-xs text-white/60 font-mono">{profile.nama_lengkap}</span>
        </div>
        <SectionDivider />
        {/* Mobile nav horizontal scroll */}
        <nav aria-label="Navigasi admin mobile" className="overflow-x-auto">
          <ul className="flex px-4 py-2 gap-1 whitespace-nowrap" role="list">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors min-h-[36px]"
                  >
                    <Icon size={14} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside
          className="hidden lg:flex flex-col w-64 bg-primary text-white flex-shrink-0 min-h-screen"
          aria-label="Navigasi admin"
        >
          {/* Logo/Brand */}
          <div className="px-5 py-6 border-b border-white/10">
            <p className="font-display font-semibold text-sm leading-tight">
              Panel Admin
            </p>
            <p className="text-xs text-white/50 font-mono mt-0.5">
              Kecamatan Duampanua
            </p>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 py-4" aria-label="Menu admin">
            <ul className="space-y-1" role="list">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-secondary/80 rounded-[var(--radius-button)] transition-colors min-h-[44px]"
                    >
                      <Icon size={16} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info + logout */}
          <div className="px-3 py-4 border-t border-white/10">
            <Link
              href="/admin/pengaturan-akun"
              className="block px-3 py-2 mb-2 rounded-[var(--radius-button)] hover:bg-white/10 transition-colors"
              title="Buka Pengaturan Akun"
            >
              <p className="text-xs text-white/40 font-mono uppercase tracking-wide">
                Masuk sebagai
              </p>
              <p className="text-sm text-white font-medium truncate">
                {profile.nama_lengkap}
              </p>
              <p className="text-xs text-white/40 font-mono">
                {isSuperAccount ? "Pengelola" : "Staf"}
              </p>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-[var(--radius-button)] transition-colors min-h-[44px]"
              >
                <LogOut size={16} aria-hidden="true" />
                Keluar
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
