import { NextResponse, type NextRequest } from "next/server";
import { defaultRoleFor } from "@/lib/auth";
import { logAction, saveProfile } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase sends people here after they click the email link or finish
 * Google sign-in. We swap the one-time code for a session cookie, create
 * their profile on first sign-in, then send them where they were going.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!code) return NextResponse.redirect(`${origin}/login?error=link`);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=link`);

  const email = data.user.email ?? "";
  await saveProfile({
    id: data.user.id,
    email,
    name: (data.user.user_metadata?.full_name as string | undefined) ?? null,
    role: defaultRoleFor(email),
  });
  await logAction({ actorId: data.user.id, action: "user.signed_in" });

  return NextResponse.redirect(`${origin}${next}`);
}
