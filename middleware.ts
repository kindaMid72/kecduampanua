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
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === Admin routes: cek auth ===
  if (pathname.startsWith("/admin")) {
    // Biarkan /admin/login lewat tanpa auth check
    if (pathname === "/admin/login" || pathname === "/admin/atur-kata-sandi") {
      return NextResponse.next();
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Jika env var belum diset di Vercel, hindari crash di Edge Runtime
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables in Middleware");
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Buat Supabase client untuk cek session
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error("Supabase auth error in middleware:", error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
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
