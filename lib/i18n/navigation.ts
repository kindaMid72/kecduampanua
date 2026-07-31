import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Navigasi helpers untuk next-intl.
 * Pakai `Link`, `redirect`, `usePathname`, `useRouter` dari sini
 * (bukan dari next/link langsung) untuk otomatis handle locale prefix.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
