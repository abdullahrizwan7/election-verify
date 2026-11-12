import type { Role } from "@/lib/types";

/** Cookie that remembers which demo account is signed in (demo mode only). */
export const DEMO_COOKIE = "ev_demo_user";

/** Pages that need someone signed in. Checked early in proxy.ts. */
export const PROTECTED_PATHS = ["/review", "/admin"];

/** Higher number = more access. An admin can do everything a reviewer can. */
export const ROLE_RANK: Record<Role, number> = { USER: 0, REVIEWER: 1, ADMIN: 2 };
