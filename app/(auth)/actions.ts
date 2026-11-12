"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEMO_COOKIE } from "@/lib/auth-constants";
import { hasSupabase } from "@/lib/config";
import { DEMO_USERS } from "@/lib/data/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MagicLinkState = { status: "idle" | "sent" | "error"; message?: string };

/** Only allow redirects to pages on this site (never to another website). */
function safeNext(value: FormDataEntryValue | null, fallback = "/"): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return h.get("origin") ?? `http://${h.get("host") ?? "localhost:3000"}`;
}

export async function sendMagicLink(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { status: "error", message: "Enter a valid email address." };

  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error) return { status: "error", message: error.message };
  return { status: "sent", message: `We sent a sign-in link to ${email.data}. Open it on this device.` };
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

/** Demo mode only: sign in as one of the sample accounts. */
export async function demoSignIn(formData: FormData) {
  if (hasSupabase) redirect("/login");

  const role = String(formData.get("role"));
  if (!(role in DEMO_USERS)) redirect("/login");

  (await cookies()).set(DEMO_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const defaultPage = role === "citizen" ? "/submit" : role === "reviewer" ? "/review" : "/admin/sources";
  const next = safeNext(formData.get("next"), defaultPage);
  redirect(next === "/" ? defaultPage : next);
}

export async function signOut() {
  if (hasSupabase) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } else {
    (await cookies()).delete(DEMO_COOKIE);
  }
  redirect("/");
}
