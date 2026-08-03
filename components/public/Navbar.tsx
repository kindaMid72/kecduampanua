"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionDivider } from "@/components/ui/SectionDivider";

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

interface DropdownMenuProps {
  item: NavItem;
  locale: string;
  onClose: () => void;
}

function DropdownMenu({ item, locale, onClose }: DropdownMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute top-full left-0 mt-1 min-w-[200px] bg-white border border-surface shadow-lg rounded-[var(--radius-card)] py-1 z-50"
    >
      {item.children?.map((child) => (
        <Link
          key={child.href}
          href={`/${locale}${child.href}`}
          role="menuitem"
          onClick={onClose}
          className="block px-4 py-2.5 text-sm text-text hover:bg-primary hover:text-white transition-colors duration-150"
        >
          {child.label}
        </Link>
      ))}
    </div>
  );
}

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const tNav = useTranslations("nav");

  const navItems: NavItem[] = [
    { label: tNav("beranda"), href: "/" },
    {
      label: tNav("profil"),
      children: [
        { label: tNav("sejarahVisiMisi"), href: "/profil" },
        { label: tNav("strukturOrganisasi"), href: "/profil#struktur" },
        { label: tNav("jumlahAsn"), href: "/profil#asn" },
        { label: tNav("ppid"), href: "/profil/ppid" },
      ],
    },
    {
      label: tNav("informasi"),
      children: [
        { label: tNav("informasiPublik"), href: "/informasi" },
        { label: tNav("berita"), href: "/berita" },
      ],
    },
    {
      label: tNav("layananPublik"),
      children: [
        { label: tNav("standarPelayanan"), href: "/standar-pelayanan" },
        { label: tNav("edaranDokumen"), href: "/edaran-dokumen" },
      ],
    },
    { label: tNav("potensiDaerah"), href: "/potensi" },
    { label: tNav("kontak"), href: "/kontak" },
  ];

  function closeAllMenus() {
    setMobileOpen(false);
    setOpenDropdown(null);
  }

  function isActive(href?: string) {
    if (!href) return false;
    const localePath = `/${locale}${href === "/" ? "" : href}`;
    return pathname === localePath || (href !== "/" && pathname.startsWith(`/${locale}${href}`));
  }

  function toggleDropdown(label: string) {
    setOpenDropdown((prev) => (prev === label ? null : label));
  }

  return (
    <header className="bg-primary text-white sticky top-0 z-40 shadow-sm">
      <nav
        className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16"
        aria-label={tNav("ariaNavigasiUtama")}
      >
        {/* Logo */}
        <Link
          href={`/${locale}`}
          onClick={closeAllMenus}
          className="flex items-center gap-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          <div
            className="h-8 w-8 rounded bg-white/20 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-xs font-mono font-bold">KD</span>
          </div>
          <span className="font-display font-semibold text-sm leading-tight hidden sm:block">
            {locale === "en" ? (
              <>
                Duampanua
                <br />
                Sub-District
              </>
            ) : (
              <>
                Kecamatan
                <br />
                Duampanua
              </>
            )}
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {navItems.map((item) => (
            <li key={item.label} className="relative">
              {item.href ? (
                <Link
                  href={`/${locale}${item.href === "/" ? "" : item.href}`}
                  onClick={closeAllMenus}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={[
                    "flex items-center h-16 px-3 text-sm font-medium transition-colors duration-150",
                    "hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                    isActive(item.href)
                      ? "border-b-2 border-accent text-white"
                      : "text-white/80",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    aria-haspopup="true"
                    aria-expanded={openDropdown === item.label}
                    className={[
                      "flex items-center gap-1 h-16 px-3 text-sm font-medium transition-colors duration-150",
                      "hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                      "text-white/80",
                    ].join(" ")}
                  >
                    {item.label}
                    <ChevronDown
                      size={14}
                      className={[
                        "transition-transform duration-150",
                        openDropdown === item.label ? "rotate-180" : "",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </button>

                  {openDropdown === item.label && (
                    <DropdownMenu
                      item={item}
                      locale={locale}
                      onClose={() => setOpenDropdown(null)}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Bahasa switcher */}
        <div className="hidden md:flex items-center gap-1 text-xs font-mono text-white/60">
          <Link
            href={`/id${pathname.replace(/^\/(id|en)/, "")}`}
            onClick={closeAllMenus}
            className={`hover:text-white transition-colors ${locale === "id" ? "text-white font-bold" : ""}`}
          >
            ID
          </Link>
          <span className="text-white/30">|</span>
          <Link
            href={`/en${pathname.replace(/^\/(id|en)/, "")}`}
            onClick={closeAllMenus}
            className={`hover:text-white transition-colors ${locale === "en" ? "text-white font-bold" : ""}`}
          >
            EN
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button
          className="md:hidden flex items-center justify-center h-11 w-11 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? tNav("tutupMenu") : tNav("bukaMenu")}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* SectionDivider di bawah navbar */}
      <SectionDivider />

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="md:hidden bg-primary border-t border-white/10 px-4 pb-4"
          role="navigation"
          aria-label={tNav("ariaNavigasiMobile")}
        >
          <ul className="space-y-1 pt-2" role="list">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={`/${locale}${item.href === "/" ? "" : item.href}`}
                    onClick={closeAllMenus}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="block px-3 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors min-h-[44px]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <details className="group">
                    <summary className="flex items-center justify-between px-3 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded cursor-pointer list-none min-h-[44px]">
                      {item.label}
                      <ChevronDown
                        size={14}
                        className="transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <ul className="pl-4 mt-1 space-y-1">
                      {item.children?.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={`/${locale}${child.href}`}
                            onClick={closeAllMenus}
                            className="block px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors min-h-[44px]"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>

          {/* Bahasa switcher mobile */}
          <div className="mt-4 pt-4 border-t border-white/10 flex gap-4 px-3">
            <Link
              href={`/id${pathname.replace(/^\/(id|en)/, "")}`}
              onClick={closeAllMenus}
              className={`text-sm font-mono ${locale === "id" ? "text-white font-bold" : "text-white/60 hover:text-white"}`}
            >
              Indonesia
            </Link>
            <Link
              href={`/en${pathname.replace(/^\/(id|en)/, "")}`}
              onClick={closeAllMenus}
              className={`text-sm font-mono ${locale === "en" ? "text-white font-bold" : "text-white/60 hover:text-white"}`}
            >
              English
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
