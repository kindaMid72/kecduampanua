import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./lib/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

/**
 * Middleware utama:
 * 1. Route /admin/* → cek auth Supabase, redirect ke login kalau belum sesi
 * 2. Route publik → handle i18n (locale prefix)
 *
 * Seluruh body dibungkus top-level try-catch agar jika ada error runtime
 * tak terduga (module resolution, Supabase call, dll), request tetap lewat
 * tanpa crash — mencegah 500 MIDDLEWARE_INVOCATION_FAILED di Vercel.
 */
export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // === Admin routes: cek auth ===
    if (pathname.startsWith("/admin")) {
      // Gunakan helper middleware resmi dari Supabase untuk refresh session
      return await updateSession(request);
    }

    // === Public routes: i18n handling ===
    return intlMiddleware(request);
  } catch (error) {
    // VULN-07 fix: Fail-CLOSED — jangan pernah lewatkan request admin tanpa
    // autentikasi saat terjadi error. Public routes tetap fail-open.
    console.error("Middleware top-level error:", error);

    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      !request.nextUrl.pathname.startsWith("/admin/login")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }
}

export const config = {
  // Match semua route kecuali static files, api routes, dan Next.js internals
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/admin/:path*",
  ],
};
