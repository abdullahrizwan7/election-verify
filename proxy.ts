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
  const { response, isSignedIn } = await refreshSession(request);
  const { pathname, search } = request.nextUrl;

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
