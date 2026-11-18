/**
 * Tests every service key in .env with one tiny real request.
 * Run with: npm run check:services
 *
 * It never prints the keys themselves, only whether each one works.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

type Result = { name: string; status: "ok" | "fail" | "off"; detail: string };
const results: Result[] = [];
const env = process.env;

async function check(name: string, configured: boolean, offHint: string, run: () => Promise<string>) {
  if (!configured) {
    results.push({ name, status: "off", detail: offHint });
    return;
  }
  try {
    results.push({ name, status: "ok", detail: await run() });
  } catch (error) {
    results.push({ name, status: "fail", detail: error instanceof Error ? error.message : String(error) });
  }
}

async function expectOk(response: Response, hint: string) {
  if (response.ok) return;
  const body = (await response.text()).slice(0, 200).replace(/\s+/g, " ");
  throw new Error(`HTTP ${response.status}. ${hint} ${body}`);
}

async function main() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const secretKey = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  await check("Database", Boolean(env.DATABASE_URL), "DATABASE_URL not set (demo mode keeps data in memory)", async () => {
    const client = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10_000 });
    await client.connect();
    try {
      await client.query("select 1");
      const tables = await client.query(`select count(*)::int as n from information_schema.tables where table_name = 'Submission'`);
      if (tables.rows[0].n === 0) throw new Error("Connected, but the tables don't exist yet. Run: npm run db:migrate");
      const count = await client.query(`select count(*)::int as n from "Submission"`);
      return `Connected. ${count.rows[0].n} submissions in the database.`;
    } finally {
      await client.end();
    }
  });

  await check("Supabase login", Boolean(supabaseUrl && publishableKey), "URL or publishable key not set (demo sign-in is used)", async () => {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: publishableKey } });
    await expectOk(response, "Check NEXT_PUBLIC_SUPABASE_URL and the publishable key.");
    const settings = (await response.json()) as { external?: Record<string, boolean> };
    return `Working. Google sign-in ${settings.external?.google ? "is on" : "is off (email links still work)"}.`;
  });

  await check("Image storage", Boolean(supabaseUrl && secretKey), "SUPABASE_SECRET_KEY not set (images kept in memory)", async () => {
    const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } });
    const { data, error } = await supabase.storage.getBucket("submissions");
    if (error || !data) throw new Error("The 'submissions' bucket is missing. Run: npm run setup:supabase");
    if (data.public) throw new Error("The 'submissions' bucket is public. Make it private in Supabase → Storage.");
    return "Private 'submissions' bucket found.";
  });

  await check("Gemini AI", Boolean(env.GEMINI_API_KEY), "GEMINI_API_KEY not set (built-in rules are used)", async () => {
    const send = (model: string) =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: 'Reply with the JSON {"ok": true}' }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
    const call = (model: string) => send(model).catch(() => send(model)); // one retry if the connection drops
    let model = env.GEMINI_MODEL || "gemini-flash-latest";
    let response = await call(model);
    let note = "";
    if ([429, 500, 503].includes(response.status)) {
      // The main model is busy; the app falls back to the lighter one, so check that too.
      note = ` (${model} is busy right now, so the app will use this one)`;
      model = env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";
      response = await call(model);
    }
    await expectOk(response, response.status === 404 ? `Model "${model}" not found. Set GEMINI_MODEL to a current model.` : "Check GEMINI_API_KEY.");
    return `Working with model ${model}${note}.`;
  });

  await check("Fact-check search", Boolean(env.GOOGLE_FACT_CHECK_API_KEY), "GOOGLE_FACT_CHECK_API_KEY not set (step skipped)", async () => {
    const params = new URLSearchParams({ query: "election", pageSize: "1", key: env.GOOGLE_FACT_CHECK_API_KEY! });
    const response = await fetch(`https://factchecktools.googleapis.com/v1alpha1/claims:search?${params}`);
    await expectOk(response, "Make sure 'Fact Check Tools API' is enabled for this key's Google Cloud project.");
    return "Working.";
  });

  await check("Web search (Tavily)", Boolean(env.TAVILY_API_KEY), "TAVILY_API_KEY not set (step skipped)", async () => {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.TAVILY_API_KEY}` },
      body: JSON.stringify({ query: "election commission announcement", max_results: 1 }),
    });
    await expectOk(response, "Check TAVILY_API_KEY and your remaining free credits.");
    return "Working.";
  });

  await check(
    "Background jobs (Inngest)",
    Boolean(env.INNGEST_DEV || env.INNGEST_EVENT_KEY),
    "Not set (checks run inside the web server, which is fine locally)",
    async () => {
      if (env.INNGEST_EVENT_KEY) return "Production keys set. Sync the app in the Inngest dashboard after deploying.";
      const response = await fetch("http://127.0.0.1:8288", { signal: AbortSignal.timeout(3_000) }).catch(() => null);
      if (!response) throw new Error("INNGEST_DEV is set but the dev server isn't running. Start it with: npx inngest-cli@latest dev");
      return "Dev server is running at http://127.0.0.1:8288.";
    },
  );

  const admins = (env.ADMIN_EMAILS ?? "").split(",").filter((e) => e.trim());
  results.push({
    name: "Admin emails",
    status: admins.length ? "ok" : "off",
    detail: admins.length ? `${admins.length} admin email(s) set.` : "ADMIN_EMAILS not set (nobody becomes admin on real sign-in)",
  });

  const icon = { ok: "✅", fail: "❌", off: "⚪" };
  console.log("\nElectionVerify service check\n");
  for (const r of results) console.log(`${icon[r.status]}  ${r.name.padEnd(26)} ${r.detail}`);
  const failed = results.filter((r) => r.status === "fail").length;
  console.log(`\n${results.filter((r) => r.status === "ok").length} working, ${failed} failing, ${results.filter((r) => r.status === "off").length} not set.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
