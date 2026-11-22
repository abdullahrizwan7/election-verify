/**
 * Builds the project report for the team: docs/ElectionVerify-Project-Report.pdf
 * (what the app does, how it works, the tech stack, database, structure,
 * deployment and screenshots). Contains no passwords or keys.
 *
 *   node scripts/project-report.mjs
 *
 * Screenshots of the current design are read from private/shots/ (take them with
 * the app running); reviewer screens come from docs/screenshots/ (npm run docs:pdf).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const v = (name) => (pkg.dependencies[name] ?? pkg.devDependencies[name] ?? "").replace(/^\^/, "");

/** An image file as a compressed data URL (optionally cropped to the top `height` px). */
async function img(path, { width = 1400, height } = {}) {
  const file = resolve(root, path);
  if (!existsSync(file)) return "";
  let pipeline = sharp(file);
  if (height) {
    const meta = await pipeline.metadata();
    pipeline = pipeline.extract({ left: 0, top: 0, width: meta.width, height: Math.min(height, meta.height) });
  }
  const buffer = await pipeline.resize({ width, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
async function png(path, width = 400) {
  const file = resolve(root, path);
  if (!existsSync(file)) return "";
  const buffer = await sharp(file).resize({ width }).png().toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

const shots = {
  hero: await img("private/shots/home.png", { height: 1640 }),
  bento: await img("private/shots/home.png", { height: 3150 }).then(async () => {
    const file = resolve(root, "private/shots/home.png");
    if (!existsSync(file)) return "";
    const b = await sharp(file).extract({ left: 0, top: 1640, width: 1440, height: 1500 }).resize({ width: 1400 }).jpeg({ quality: 78 }).toBuffer();
    return `data:image/jpeg;base64,${b.toString("base64")}`;
  }),
  verified: await img("private/shots/verified.png"),
  submit: await img("private/shots/submit.png"),
  login: await img("private/shots/login.png"),
  result: await img("private/shots/result.png", { height: 1200 }),
  queue: await img("docs/screenshots/queue.png"),
  board: await img("docs/screenshots/board.png"),
  ai: await img("docs/screenshots/ai.png", { width: 600 }),
  analytics: await img("docs/screenshots/analytics.png"),
  forensics: await img("docs/screenshots/forensics.png"),
  video: await img("public/videos/electionverify-intro-poster.jpg"),
};
const people = {
  sandeep: await png("video/characters/sandeep-1.png", 260),
  uday: await png("video/characters/uday-1.png", 260),
  abdullah: await png("video/characters/abdullah-1.png", 260),
};

const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const STACK = [
  ["Framework", "Next.js (App Router)", v("next"), "Pages, server actions and API routes in one project; Cache Components for fast pages."],
  ["UI library", "React", v("react"), "Server Components, useActionState forms, view transitions between pages."],
  ["Language", "TypeScript", v("typescript"), "Type safety across the whole codebase."],
  ["Styling", "Tailwind CSS + shadcn/ui", v("tailwindcss"), "Design tokens, dark/light themes, accessible Radix components."],
  ["Animation", "motion (Framer Motion)", v("motion"), "Headline reveals, magnetic buttons, staggered cards, tilting preview."],
  ["Database", "PostgreSQL on Supabase", "—", "Free hosted Postgres; stores submissions, claims, evidence, reviews."],
  ["ORM", "Prisma + pg adapter", v("prisma"), "Typed database access, migrations and seed data."],
  ["Login", "Supabase Auth", v("@supabase/ssr"), "Google sign-in and email magic links; no passwords stored by us."],
  ["File storage", "Supabase Storage", "—", "Private bucket for uploaded screenshots (signed URLs only)."],
  ["AI", "Google Gemini", "flash / flash-lite", "Extracts claims, describes images, suggests a verdict with citations."],
  ["Fact-checks", "Google Fact Check Tools API", "v1alpha1", "Finds existing fact-checks (Alt News, BOOM, FACTLY…)."],
  ["Web evidence", "Tavily Search API", "—", "Searches trusted Indian news and official sites first."],
  ["Article reading", "Mozilla Readability + jsdom", v("@mozilla/readability"), "Pulls clean text out of news pages."],
  ["Image checks", "Tesseract OCR, exifr, sharp", v("tesseract.js"), "Text in images, photo metadata, perceptual hash for duplicates."],
  ["Domain age", "RDAP", "—", "Free WHOIS replacement: when a website was registered."],
  ["Background jobs", "Inngest (optional)", v("inngest"), "Runs the checking pipeline outside the request when enabled."],
  ["Charts & diagrams", "Recharts, React Flow, cobe", v("recharts"), "Analytics charts, evidence board, 3D globe."],
  ["Validation", "Zod", v("zod"), "Every form and API input is checked on the server."],
  ["Testing", "Vitest + Playwright", `${v("vitest")} / ${v("@playwright/test")}`, "72 unit tests and 8 browser tests; run on GitHub on every push."],
  ["Hosting", "Vercel (Hobby)", "—", "Free hosting with HTTPS at election-verify.vercel.app."],
  ["Video", "HTML + Playwright + ffmpeg, edge-tts", "—", "The 94-second intro video, rendered frame by frame with neural voices."],
];

const PIPELINE = [
  ["1", "Read the content", "Opens the link safely (blocks private/internal addresses), extracts the article text."],
  ["2", "Check the source", "Trusted-sources list, domain age (RDAP), HTTPS, satire / known-misinformation flags."],
  ["3", "Analyze the image", "OCR text, EXIF details, perceptual hash to spot re-saved copies, AI observations."],
  ["4", "Find the claims", "Gemini (or a rule-based fallback) splits the message into checkable claims."],
  ["5", "Search fact-checks", "Google Fact Check Tools: existing ratings from IFCN fact-checkers."],
  ["6", "Gather evidence", "Tavily search on trusted sites first; AI marks each result supports / refutes / neutral."],
  ["7", "Prepare for review", "Gemini drafts a verdict + confidence + summary citing evidence IDs. Never published automatically."],
];

const MODELS = [
  ["Profile", "id, email, name, role (USER / REVIEWER / ADMIN)", "Everyone who signs in."],
  ["Submission", "type (LINK / TEXT / IMAGE), url, text, imagePath, contentHash, imageHash, reportCount, status, steps, aiVerdict, aiConfidence, aiSummary, finalVerdict, publicNote", "One thing a citizen asked us to check."],
  ["Claim", "submissionId, text, position", "A single checkable statement pulled out of a submission."],
  ["Evidence", "kind, title, url, publisher, rating, stance, snippet, data", "Source info, fact-checks, web results, image findings, reviewer notes."],
  ["Review", "submissionId, reviewerId, verdict, publicNote, internalNote", "The human decision that gets published."],
  ["Source", "domain, name, type, trust (0–100)", "Trusted-sources list (ECI, PIB, fact-checkers, news, satire)."],
  ["AuditLog", "actorId, action, submissionId, meta", "Who did what and when. Never edited or deleted."],
];

const ROUTES = [
  ["/", "Home: hero, live dashboard preview, sources, features, recent verdicts", "Everyone"],
  ["/verified", "Search and filter all published verdicts", "Everyone"],
  ["/s/[id]", "Result page: live progress, verdict, evidence board, share card", "Everyone (with link)"],
  ["/about", "Our method: how claims are checked and how AI is used", "Everyone"],
  ["/login", "Google sign-in or email link", "Everyone"],
  ["/submit", "Submit a link, message or image (10 per hour)", "Signed in"],
  ["/my", "My submissions and their status", "Signed in"],
  ["/review, /review/[id]", "Review queue; evidence, AI suggestion, publish verdict", "Reviewer"],
  ["/review/analytics", "Trends, verdict mix, review speed", "Reviewer"],
  ["/admin/sources, /activity, /setup", "Trusted sources, audit log, service status", "Admin"],
  ["/api/search, /api/inngest, /auth/callback", "Search API, background jobs, sign-in callback", "System"],
];

const ENV = ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "ADMIN_EMAILS", "GEMINI_API_KEY", "GOOGLE_FACT_CHECK_API_KEY", "TAVILY_API_KEY", "NEXT_PUBLIC_SITE_URL", "INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY (optional)"];

const table = (head, rows, cls = "") =>
  `<table class="${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
const figure = (src, caption, cls = "", height = 0) =>
  src ? `<figure class="${cls}"><img src="${src}" ${height ? `style="height:${height}mm;object-fit:cover;object-position:top"` : ""} /><figcaption>${caption}</figcaption></figure>` : "";

const html = `<!doctype html><html><head><meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Urbanist, -apple-system, "Segoe UI", sans-serif; color: #1c1917; font-size: 10.8pt; line-height: 1.45; }
  .page { width: 210mm; height: 297mm; overflow: hidden; padding: 15mm 16mm 16mm; page-break-after: always; position: relative; background: #fbfaf7; }
  .cover { background: #111010; color: #f5f3ef; padding: 22mm 18mm; overflow: hidden; }
  .cover .glow { position: absolute; width: 140mm; height: 140mm; border-radius: 50%; filter: blur(60px); opacity: .5; }
  .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15pt; }
  .logo { width: 34px; height: 34px; border-radius: 50%; background: #f07a26; display: grid; place-items: center; color: #fff; font-size: 16pt; }
  h1 { font-size: 40pt; line-height: 1.02; margin: 16mm 0 6mm; letter-spacing: -1px; }
  .orange { color: #f07a26; }
  h2 { font-size: 22pt; margin: 0 0 4mm; letter-spacing: -0.4px; }
  h2 .num { color: #f07a26; margin-right: 6px; }
  h3 { font-size: 13.5pt; margin: 6mm 0 2mm; }
  p { margin: 0 0 3mm; }
  .lead { font-size: 13pt; color: #57534e; }
  .cover .lead { color: #c9c4bd; max-width: 150mm; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 4mm 0; }
  .chip { border-radius: 999px; padding: 4px 12px; font-size: 9.5pt; font-weight: 600; background: #f3efe8; }
  .cover .chip { background: rgba(255,255,255,.08); color: #eee; }
  .team { display: flex; gap: 8mm; margin-top: 10mm; align-items: flex-end; }
  .member { text-align: center; }
  .member img { height: 48mm; display: block; margin: 0 auto 2mm; }
  .member b { display: block; font-size: 11.5pt; } .member span { font-size: 9.5pt; color: #b5afa7; }
  .links { margin-top: 10mm; display: grid; gap: 3mm; font-size: 11pt; }
  .links div { background: rgba(255,255,255,.06); border-radius: 12px; padding: 3mm 5mm; }
  .links b { color: #f07a26; display: inline-block; width: 32mm; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 9pt; margin: 2.5mm 0 4mm; border: 1px solid #e7e2da; border-radius: 12px; overflow: hidden; }
  th { background: #1c1917; color: #fff; text-align: left; padding: 5px 8px; font-weight: 600; }
  td { padding: 4.5px 8px; border-top: 1px solid #ece7df; vertical-align: top; background: #fff; }
  td:first-child { font-weight: 600; white-space: nowrap; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
  .card { border-radius: 16px; padding: 4mm 5mm; }
  .olive { background: #d4f07a; color: #2a3a0c; } .rust { background: #f4b8ad; color: #4a1a12; }
  .steel { background: #bcd3f2; color: #182b45; } .ink { background: #25282d; color: #f5f5f5; }
  .card h3 { margin-top: 0; margin-bottom: 1.5mm; } .card p { font-size: 9.4pt; margin: 0; opacity: .85; }
  figure { margin: 3mm 0 5mm; } figure img { width: 100%; border-radius: 12px; border: 1px solid #e3ddd4; display: block; }
  figcaption { font-size: 9pt; color: #78716c; margin-top: 1.5mm; }
  .small img { height: 74mm; object-fit: cover; object-position: top; }
  .flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 4mm 0; }
  .flow div { border-radius: 14px; padding: 4mm; font-size: 9.6pt; background: #fff; border: 1px solid #e7e2da; }
  .flow b { display: block; font-size: 11pt; margin-bottom: 1mm; } .flow i { color: #f07a26; font-style: normal; font-weight: 800; }
  .arch { display: grid; grid-template-columns: 1fr 1.3fr 1fr; gap: 4mm; align-items: stretch; margin: 4mm 0 6mm; font-size: 9.6pt; }
  .arch .box { border-radius: 14px; padding: 4mm; border: 1px solid #e3ddd4; background: #fff; }
  .arch .box > b { display: block; font-size: 11pt; margin-bottom: 1.5mm; }
  .arch .mid code { background: rgba(255,255,255,.14); color: #fff; }
  .arch .mid { background: #1f1c1a; color: #f5f3ef; border: none; }
  .arch ul { margin: 0; padding-left: 4mm; } .arch li { margin: 0.6mm 0; }
  pre { background: #1c1917; color: #f3efe8; border-radius: 12px; padding: 4mm 5mm; font-size: 8.6pt; line-height: 1.45; white-space: pre-wrap; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 9pt; background: #f1ece4; padding: 1px 5px; border-radius: 5px; }
  pre code { background: none; padding: 0; }
  ul.tight { margin: 1mm 0 4mm; padding-left: 5mm; } ul.tight li { margin: 1mm 0; }
  .note { border-left: 4px solid #f07a26; background: #fff4ea; padding: 3mm 4mm; border-radius: 0 10px 10px 0; font-size: 10pt; margin: 3mm 0; }
  .foot { position: absolute; bottom: 7mm; left: 17mm; right: 17mm; font-size: 8.5pt; color: #a8a29e; display: flex; justify-content: space-between; }
</style></head><body>

<section class="page cover">
  <div class="glow" style="background:#f07a26;top:-40mm;right:-30mm"></div>
  <div class="glow" style="background:#c2410c;bottom:-60mm;left:-40mm;opacity:.35"></div>
  <div style="position:relative">
    <div class="brand"><span class="logo">✓</span> ElectionVerify</div>
    <h1>Check election news<br /><span class="orange">before you share it.</span></h1>
    <p class="lead">Project report for the team: what we built, how it works, the technology behind it, and how to run and deploy it. AI gathers the evidence; a human reviewer always makes the final call.</p>
    <div class="chips"><span class="chip">Next.js 16</span><span class="chip">Supabase</span><span class="chip">Gemini AI</span><span class="chip">Google Fact Check</span><span class="chip">Tavily</span><span class="chip">Vercel</span><span class="chip">English · हिन्दी · اردو</span></div>
    <div class="team">
      <div class="member">${people.abdullah ? `<img src="${people.abdullah}" />` : ""}<b>Abdullah Rizwan</b><span>Admin · project lead</span></div>
      <div class="member">${people.uday ? `<img src="${people.uday}" />` : ""}<b>Uday</b><span>Reviewer</span></div>
      <div class="member">${people.sandeep ? `<img src="${people.sandeep}" />` : ""}<b>Sandeep</b><span>Citizen</span></div>
    </div>
    <div class="links">
      <div><b>Live website</b> https://election-verify.vercel.app</div>
      <div><b>Source code</b> https://github.com/abdullahrizwan7/election-verify</div>
      <div><b>Report date</b> ${today}</div>
    </div>
  </div>
</section>

<section class="page">
  <h2><span class="num">01</span>What ElectionVerify does</h2>
  <p class="lead">During elections, fake forwards ("polls close at 2 PM", "EVMs can be hacked by Bluetooth") spread faster than anyone can check them. ElectionVerify lets anyone ask <b>"Is this true?"</b> and get a clear, sourced answer.</p>
  <div class="flow">
    <div><i>01</i><b>Submit</b>A citizen sends a news link, a forwarded message or a screenshot.</div>
    <div><i>02</i><b>Evidence</b>In about a minute the system checks the source, fact-checkers and trusted news.</div>
    <div><i>03</i><b>Human review</b>A reviewer reads the evidence and the AI suggestion, then decides.</div>
    <div><i>04</i><b>Published</b>A verdict with a plain-language explanation, free to search and share.</div>
  </div>
  <h3>Three roles</h3>
  ${table(["Role", "Can do", "In our team"], [
    ["Citizen (USER)", "Submit claims (10 per hour), follow progress, see own submissions", "Sandeep"],
    ["Reviewer", "Review queue, evidence board, add evidence, publish verdicts, analytics", "Uday"],
    ["Admin", "Everything above + trusted sources, audit log, service setup", "Abdullah Rizwan"],
  ])}
  <p>Everyone uses the same login (Google or email link). The role comes from the account: emails listed in <code>ADMIN_EMAILS</code> become admins; reviewers are set in the database. Signed-out visitors can read and search every published verdict.</p>
  <h3>Six verdicts</h3>
  <div class="chips"><span class="chip" style="background:#dcf5e5">Accurate</span><span class="chip" style="background:#fdecc8">Misleading</span><span class="chip" style="background:#fde3cf">Missing context</span><span class="chip" style="background:#fbd5d5">False</span><span class="chip" style="background:#e7e5e4">Unverified</span><span class="chip" style="background:#e9e0fb">Satire</span></div>
  ${figure(shots.hero, "The new home page: floating navigation islands, animated headline and a tilting preview of the reviewer workspace with live numbers.", "small")}
  <div class="foot"><span>ElectionVerify · Project report</span><span>2</span></div>
</section>

<section class="page">
  <h2><span class="num">02</span>The checking pipeline</h2>
  <p>Every submission runs through seven steps in the background. The result page shows each step live. If an API key is missing, a step is skipped or falls back to built-in rules, so the app never breaks.</p>
  ${table(["#", "Step", "What happens"], PIPELINE)}
  <div class="note"><b>AI never publishes.</b> Gemini only suggests a verdict and must cite the evidence it used (e.g. <code>ev-5c</code>). Citations are validated, user text is wrapped to resist prompt injection, and the final verdict is always chosen by a human reviewer.</div>
  <h3>Key features</h3>
  <div class="grid2">
    <div class="card olive"><h3>Smart claim checks</h3><p>Source reputation with 33 real Indian sources (ECI, PIB, Alt News, BOOM, FACTLY…), domain age, claim extraction, duplicate detection (same text or re-saved image) with a report counter.</p></div>
    <div class="card steel"><h3>AI with citations</h3><p>Gemini flash with an automatic fallback model when busy, retries on dropped connections, confidence gauge, evidence board with supports / refutes / neutral links.</p></div>
    <div class="card rust"><h3>Image forensics</h3><p>OCR with word boxes, EXIF metadata, perceptual hash to find earlier copies, reverse image search links, AI observations marked as "not proof".</p></div>
    <div class="card ink"><h3>Trust & accountability</h3><p>Roles checked on the server for every action, audit log of every step, hourly limits, safe link fetching, security headers, shareable result cards.</p></div>
  </div>
  <p style="margin-top:4mm">Also: English / Hindi / Urdu interface, search across verified claims, analytics for reviewers, presenter mode for demos, offline page (PWA), ⌘K command palette, dark and light themes, and a 94-second narrated intro video.</p>
  <div class="foot"><span>ElectionVerify · Project report</span><span>3</span></div>
</section>

<section class="page">
  <h2><span class="num">03</span>Tech stack</h2>
  <p>Everything runs on free plans. Versions are taken from <code>package.json</code>.</p>
  ${table(["Layer", "Technology", "Version", "Why we use it"], STACK)}
  <div class="foot"><span>ElectionVerify · Project report</span><span>4</span></div>
</section>

<section class="page">
  <h2><span class="num">04</span>Architecture</h2>
  <div class="arch">
    <div class="box"><b>Browser</b><ul><li>Next.js pages (React 19)</li><li>Sign in with Google / email</li><li>Live progress, evidence board</li><li>Hindi / Urdu, dark / light</li></ul></div>
    <div class="box mid"><b>Next.js 16 on Vercel</b><ul><li><b>proxy.ts</b>: sign-in gate, error redirects</li><li><b>Server Actions</b>: submit, publish, add evidence, sources</li><li><b>Pipeline</b> (lib/pipeline): 7 steps via <code>after()</code> or Inngest</li><li><b>Data layer</b> (lib/data): Prisma store, or in-memory demo store without keys</li><li>Role checks with <code>requireRole()</code> on the server</li></ul></div>
    <div class="box"><b>Services</b><ul><li><b>Supabase</b>: Postgres, Auth, Storage</li><li><b>Gemini</b>: claims, image notes, suggestion</li><li><b>Google Fact Check</b></li><li><b>Tavily</b> web search</li><li><b>RDAP</b> domain age</li><li>Inngest (optional)</li></ul></div>
  </div>
  <h3>Database (Prisma models)</h3>
  ${table(["Model", "Main fields", "Purpose"], MODELS)}
  <p>Two migrations create the schema (<code>prisma/migrations</code>); <code>npm run db:seed</code> loads sample data and <code>npm run db:sources</code> loads the trusted Indian sources.</p>
  <div class="foot"><span>ElectionVerify · Project report</span><span>5</span></div>
</section>

<section class="page">
  <h2><span class="num">05</span>Pages, folders and code structure</h2>
  ${table(["Route", "What it shows", "Who"], ROUTES)}
  <h3>Folder structure</h3>
<pre><code>app/                  Pages and API routes (Next.js App Router)
  (public)/           Home, verified, submit, result, about, my
  (auth)/login        Login page and sign-in actions
  review/  admin/     Reviewer and admin areas
components/           UI: home, evidence, review, layout, fx, ui (shadcn)
lib/
  pipeline/           The 7 checking steps, safe fetch, OCR, hashing, rules
  ai/                 Gemini client and prompts (with citations)
  data/               Repository: Prisma store + demo store, Indian sources
  supabase/  auth.ts  Login sessions and role checks
  i18n/               English, Hindi and Urdu text
prisma/               schema.prisma, migrations, seed
scripts/              check:services, setup:supabase, video, video:audio, PDFs
video/                Intro video source (HTML timeline, characters, narration)
tests/unit, tests/e2e Vitest and Playwright tests
proxy.ts              Runs before every request (Next.js 16 middleware)</code></pre>
  <div class="foot"><span>ElectionVerify · Project report</span><span>6</span></div>
</section>

<section class="page">
  <h2><span class="num">06</span>Security, quality and testing</h2>
  <ul class="tight">
    <li><b>Server-side permissions:</b> every action re-checks the role (submit needs sign-in, publish needs Reviewer, sources need Admin). Restricted pages redirect to login.</li>
    <li><b>Safe link fetching:</b> blocks private and internal network addresses (SSRF protection), size and time limits.</li>
    <li><b>Spam limits:</b> 10 submissions per person per hour; duplicates are merged and counted.</li>
    <li><b>Private uploads:</b> images live in a private Supabase bucket and are shown through short-lived signed links.</li>
    <li><b>Audit log:</b> sign-ins, submissions, re-runs and published verdicts are recorded.</li>
    <li><b>Security headers:</b> HSTS, no-sniff, frame-deny, referrer and permissions policies.</li>
    <li><b>No secrets in code:</b> keys live only in <code>.env</code> (git-ignored) and in Vercel's environment settings.</li>
  </ul>
  ${table(["Check", "Tool", "Result"], [
    ["Unit tests", "Vitest", "72 passing (pipeline rules, validation, image hash, sources, safe fetch…)"],
    ["Browser tests", "Playwright", "8 end-to-end flows (submit → review → publish, permissions, search…)"],
    ["Types and lint", "TypeScript, ESLint", "Clean"],
    ["CI", "GitHub Actions", "Lint, types, tests, build and browser tests on every push"],
    ["Service check", "npm run check:services", "Tests every API key with one real request"],
  ])}
  ${figure(shots.result, "Result page: live pipeline progress while the checks run.", "small")}
  <div class="foot"><span>ElectionVerify · Project report</span><span>7</span></div>
</section>

<section class="page">
  <h2><span class="num">07</span>Deployment and running it locally</h2>
  <h3>Live setup</h3>
  ${table(["Part", "Where", "Notes"], [
    ["Website", "Vercel (Hobby, free)", "election-verify.vercel.app · deploy with <code>npx vercel deploy --prod</code>"],
    ["Database + login + storage", "Supabase (free)", "Session pooler locally, transaction pooler (port 6543) on Vercel"],
    ["Google sign-in", "Google Cloud OAuth client", "Redirect: Supabase callback · test users can sign in"],
    ["Code", "GitHub", "abdullahrizwan7/election-verify (public, no secrets)"],
  ])}
  <h3>Environment variables (names only, values are private)</h3>
  <div class="chips">${ENV.map((e) => `<span class="chip"><code style="background:none">${e}</code></span>`).join("")}</div>
  <h3>Run it on your laptop</h3>
<pre><code>git clone https://github.com/abdullahrizwan7/election-verify.git
cd election-verify
npm install                 # also generates the Prisma client
cp .env.example .env        # add keys (ask Abdullah), or leave empty for demo mode
npm run dev                 # http://localhost:3000
npm test                    # unit tests
npm run check:services      # verify every key works</code></pre>
  <div class="note">Without any keys the app runs in <b>demo mode</b>: sample data in memory and one-click sign-in as Citizen, Reviewer or Admin. Perfect for trying it out.</div>
  <h3>Design</h3>
  <p>The look follows the Cognify project's "floating dock" design system: a light pastel-mesh background (with a matching ink dark mode), frosted glass cards, the Urbanist font, black pill buttons with an orange accent, and four tile colours (lime, coral, sky, ink). The header is three floating islands with a sliding black "active" pill; the reviewer workspace adds a dark dock on the left. Motion (the <code>motion</code> library) gives word-by-word headlines, magnetic buttons, staggered cards and a tilting dashboard preview, and switches off for people who turn animations off.</p>
  <div class="foot"><span>ElectionVerify · Project report</span><span>8</span></div>
</section>

<section class="page">
  <h2><span class="num">08</span>Screens</h2>
  ${figure(shots.bento, "Home page: feature cards in the four tile colours.", "", 125)}
  <div class="grid2">
    ${figure(shots.verified, "Verified claims: search and filter by verdict.", "", 62)}
    ${figure(shots.login, "Login: Google or email link, one page for all roles.", "", 62)}
  </div>
  <div class="foot"><span>ElectionVerify · Project report</span><span>9</span></div>
</section>

<section class="page">
  <h2><span class="num">09</span>Reviewer tools</h2>
  ${figure(shots.queue, "Review queue: claims waiting, sorted by urgency or reports.", "", 78)}
  <div class="grid2">
    ${figure(shots.board, "Evidence board: how evidence relates to the claims.", "", 48)}
    ${figure(shots.forensics, "Image forensics: OCR boxes and photo details.", "", 48)}
  </div>
  ${figure(shots.analytics, "Analytics: verdict mix, trends and review speed.", "", 70)}
  <div class="foot"><span>ElectionVerify · Project report</span><span>10</span></div>
</section>

<section class="page">
  <h2><span class="num">10</span>Intro video and what's next</h2>
  <p>"Watch the guided demo" on the home page plays a 94-second narrated video (also in <code>public/videos</code>). It is built from code: an HTML timeline (<code>video/intro.html</code>) recorded frame by frame with Playwright and ffmpeg, with the team's 3D characters, lip-sync, composed music and natural Indian neural voices (Neerja, Valluvar, Madhur, Prabhat).</p>
  ${figure(shots.video, "Intro video title frame. Rebuild with npm run video:audio && npm run video.")}
  <h3>Ideas for next steps</h3>
  <ul class="tight">
    <li>WhatsApp / Telegram bot so people can forward a message directly.</li>
    <li>Admin → Users page to promote reviewers inside the app.</li>
    <li>Publish the Google sign-in app so anyone (not just test users) can use Google login.</li>
    <li>Regional languages (Tamil, Telugu, Bengali) and state election office sources.</li>
    <li>Email or push notifications when a submitted claim gets its verdict.</li>
  </ul>
  <div class="note">Questions about the code or keys: ask Abdullah Rizwan. Keys are never shared in documents or chat.</div>
  <div class="foot"><span>ElectionVerify · Project report</span><span>11</span></div>
</section>
</body></html>`;

const out = resolve(root, "docs/ElectionVerify-Project-Report.pdf");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => page.setContent(html.replace(/<link[^>]+fonts[^>]+>/, "")));
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
writeFileSync(resolve(root, "private/report-preview.html"), html);
console.log(`Saved ${out}`);
