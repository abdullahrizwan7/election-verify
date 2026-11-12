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
export const hasImageStorage = Boolean(
  supabaseUrl && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
);

/** Emails listed here become admins the first time they sign in. */
export const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/** Optional free services used by the verification pipeline. Each one is skipped when its key is missing. */
export const services = {
  gemini: { apiKey: process.env.GEMINI_API_KEY ?? "", model: process.env.GEMINI_MODEL || "gemini-flash-latest" },
  factCheck: { apiKey: process.env.GOOGLE_FACT_CHECK_API_KEY ?? "" },
  tavily: { apiKey: process.env.TAVILY_API_KEY ?? "" },
  /** Inngest runs the pipeline as a background job. Without it, the pipeline runs inside the web server. */
  inngest: { enabled: Boolean(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV) },
};

/** Pause between pipeline steps in demo mode so the progress list is easy to follow in a presentation. */
export const demoStepDelayMs = Number(process.env.PIPELINE_STEP_DELAY_MS ?? (hasDatabase ? 0 : 700));

/** Citizens can send at most this many items per hour. Reviewers and admins have no limit. */
export const SUBMISSIONS_PER_HOUR = 10;

export const STORAGE_BUCKET = "submissions";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
