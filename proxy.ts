import { NextResponse, type NextRequest } from "next/server";
import { PROTECTED_PATHS } from "@/lib/auth-constants";
import { refreshSession } from "@/lib/supabase/session";

/**
 * Runs before every page request (Next.js 16 renamed middleware.ts to proxy.ts).
 *
 * This is only a quick first check that sends signed-out visitors to /login.
 * The real permission checks happen on the server in each page and action
 * with requireRole(), because a proxy check alone is not enough.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  // When Google or email sign-in fails, Supabase sends people to the site with
  // ?error_description=... Show the friendly message on the login page instead.
  if (searchParams.has("error_description") && pathname !== "/login") {
    console.warn("[auth] sign-in failed:", searchParams.get("error_description"));
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  const { response, isSignedIn } = await refreshSession(request);

  const isProtected = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isProtected && !isSignedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Skip static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|demo/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
