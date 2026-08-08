import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * VULN-01 fix: Validasi redirect hanya boleh ke path internal /admin/*.
 * Mencegah open redirect ke domain eksternal.
 */
function isSafeRedirect(path: string): boolean {
  return (
    typeof path === "string" &&
    path.startsWith("/admin") &&
    !path.includes("//") &&
    !path.includes(":")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: You *must* call supabase.auth.getUser() to refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect ke halaman login jika user belum login dan mengakses rute /admin
  const isLoginRoute = request.nextUrl.pathname.startsWith("/admin/login");
  const isResetRoute = request.nextUrl.pathname.startsWith("/admin/atur-kata-sandi");
  
  if (!user && request.nextUrl.pathname.startsWith("/admin") && !isLoginRoute && !isResetRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // VULN-01 fix: hanya set redirect jika path aman (internal /admin/*)
    const candidate = request.nextUrl.pathname;
    if (isSafeRedirect(candidate)) {
      url.searchParams.set("redirect", candidate);
    }
    return NextResponse.redirect(url);
  }
  
  // Redirect ke dashboard jika sudah login tapi mengakses rute login saja
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
