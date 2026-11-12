import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/auth-constants";
import { hasSupabase, supabaseKey, supabaseUrl } from "@/lib/config";

/**
 * Runs in proxy.ts before every page request.
 * It refreshes the Supabase login cookie (if Supabase is configured) and
 * reports whether someone is signed in.
 */
export async function refreshSession(request: NextRequest) {
  if (!hasSupabase) {
    return { response: NextResponse.next({ request }), isSignedIn: request.cookies.has(DEMO_COOKIE) };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() checks the token's signature, so it can be trusted.
  const { data } = await supabase.auth.getClaims();
  return { response, isSignedIn: Boolean(data?.claims?.sub) };
}
