/**
 * Feature switches read from environment variables.
 *
 * The app runs in "demo mode" when the keys are missing: data lives in memory
 * and you sign in by picking a role. Add the keys from .env.example to switch
 * on the real database (PostgreSQL via Prisma) and real login (Supabase).
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasDatabase = Boolean(process.env.DATABASE_URL);
export const hasSupabase = Boolean(supabaseUrl && supabaseKey);

/** Emails listed here become admins the first time they sign in. */
export const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const STORAGE_BUCKET = "submissions";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
