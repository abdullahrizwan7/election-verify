import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/auth-constants";
import { hasSupabase } from "@/lib/config";
import { DEMO_USERS } from "@/lib/data/demo-data";

/**
 * Used by presenter mode to switch demo accounts between steps, for example
 * /demo/start?as=reviewer&next=/review. Only works in demo mode: with real
 * Supabase login it just goes to the page.
 */
export function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("as") ?? "";
  const nextParam = request.nextUrl.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const response = NextResponse.redirect(new URL(next, request.url));
  if (!hasSupabase && role in DEMO_USERS) {
    response.cookies.set(DEMO_COOKIE, role, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return response;
}
