/**
 * One-time Supabase setup that can be done with your secret key:
 * creates the private "submissions" bucket for uploaded images.
 * Run with: npm run setup:supabase
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "submissions";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env first.");
    process.exit(1);
  }

  const supabase = createClient(url, secretKey, { auth: { persistSession: false } });
  const { data: existing } = await supabase.storage.getBucket(BUCKET);

  if (existing) {
    console.log(`✅ Bucket "${BUCKET}" already exists (${existing.public ? "PUBLIC: make it private in the dashboard" : "private"}).`);
  } else {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error) {
      console.error(`❌ Could not create the bucket: ${error.message}`);
      process.exit(1);
    }
    console.log(`✅ Created private bucket "${BUCKET}" (images up to 5 MB).`);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  console.log(`
Two things to do by hand in the Supabase dashboard:
  1. Authentication → URL Configuration → Redirect URLs: add
       http://localhost:3000/auth/callback${site.startsWith("http://localhost") ? "" : `\n       ${site}/auth/callback`}
  2. (Optional) Authentication → Sign In / Providers → Google, for "Continue with Google".

Then create the tables and sample data:
  npm run db:migrate
  npm run db:seed
`);
}

main();
