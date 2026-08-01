import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./lib/i18n/routing";

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
      // Biarkan /admin/login lewat tanpa auth check
      if (pathname === "/admin/login" || pathname === "/admin/atur-kata-sandi") {
        return NextResponse.next();
      }

      // Cek cookie auth Supabase tanpa load SDK yang tidak edge-safe
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      // Fallback cek secara generik jika env belum siap
      const hasSession = request.cookies.getAll().some(
        (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
      );

      if (!hasSession) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    }

    // === Public routes: i18n handling ===
    return intlMiddleware(request);
  } catch (error) {
    // Fallback: jika APAPUN error, biarkan request lewat tanpa crash
    console.error("Middleware top-level error:", error);
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
