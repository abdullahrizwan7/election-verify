import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { DEMO_COOKIE, ROLE_RANK } from "@/lib/auth-constants";
import { adminEmails, hasSupabase } from "@/lib/config";
import { getProfile } from "@/lib/data";
import { DEMO_USERS } from "@/lib/data/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, Role } from "@/lib/types";

/**
 * Returns the signed-in person, or null.
 * `cache` makes sure we only look it up once per request, even if many
 * components ask for it.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  if (!hasSupabase) {
    const key = (await cookies()).get(DEMO_COOKIE)?.value;
    return key && key in DEMO_USERS ? DEMO_USERS[key as keyof typeof DEMO_USERS] : null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const profile = await getProfile(claims.sub);
  if (profile) return profile;

  const email = claims.email ?? "";
  return { id: claims.sub, email, name: null, role: defaultRoleFor(email) };
});

export function defaultRoleFor(email: string): Role {
  return adminEmails.includes(email.toLowerCase()) ? "ADMIN" : "USER";
}

export function hasRole(user: AppUser | null, role: Role): boolean {
  return Boolean(user && ROLE_RANK[user.role] >= ROLE_RANK[role]);
}

/** Use at the top of a protected page or Server Action. */
export async function requireUser(next: string): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireRole(role: Role, next: string): Promise<AppUser> {
  const user = await requireUser(next);
  if (!hasRole(user, role)) redirect(`/login?error=forbidden&next=${encodeURIComponent(next)}`);
  return user;
}
