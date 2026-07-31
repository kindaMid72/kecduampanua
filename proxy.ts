import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Middleware utama:
 * 1. Route /admin/* → cek auth Supabase, redirect ke login kalau belum sesi
 * 2. Route publik → handle i18n (locale prefix)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === Admin routes: cek auth ===
  if (pathname.startsWith("/admin")) {
    // Biarkan /admin/login lewat tanpa auth check
    if (pathname === "/admin/login" || pathname === "/admin/atur-kata-sandi") {
      return NextResponse.next();
    }

    // Buat Supabase client untuk cek session
    let response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // === Public routes: i18n handling ===
  return intlMiddleware(request);
}

export const config = {
  // Match semua route kecuali static files, api routes, dan Next.js internals
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/admin/:path*",
  ],
};
