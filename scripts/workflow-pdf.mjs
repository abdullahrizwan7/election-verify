/**
 * Builds docs/ElectionVerify-Workflow.pdf: a slide-style overview of how the
 * project works, with real screenshots of the running app.
 *
 * 1. Start the app in demo mode:   npm run build && npm start   (port 3000)
 * 2. Run:                          npm run docs:pdf
 *    (or BASE_URL=http://localhost:3100 npm run docs:pdf for another port)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = new URL("../docs/", import.meta.url);
const SHOTS = new URL("../docs/screenshots/", import.meta.url);

async function main() {
  await mkdir(SHOTS, { recursive: true });
  const browser = await chromium.launch();

  // ── 1. Screenshots of the real app ────────────────────────────────
  // Screenshots for the docs leave out the "Demo mode" notice bar.
  const hideBanner = () => document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = "[data-demo-banner]{display:none!important}";
    document.head.append(style);
  });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, colorScheme: "light", reducedMotion: "reduce" });
  await desktop.addInitScript(hideBanner);
  const page = await desktop.newPage();
  const shot = async (path, file, selector) => {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const target = selector ? page.locator(selector).first() : page;
    await target.screenshot({ path: new URL(file, SHOTS).pathname });
    console.log("  📸", file);
  };

  console.log("Taking screenshots from", BASE);
  await shot("/", "home.png");
  await page.goto(`${BASE}/demo/start?as=citizen&next=/`);
  await shot("/submit?prefill=demo", "submit.png");
  await shot("/s/counting-livestream", "progress.png", '[data-tour="pipeline"]');
  await shot("/s/polling-hours-message", "result.png");
  await page.goto(`${BASE}/demo/start?as=reviewer&next=/`);
  await shot("/review", "queue.png");
  await shot("/review?view=board", "review-board.png", "[data-tour=\"board\"]");
  await shot("/review/ballots-in-river", "board.png", '[data-tour="evidence-board"]');
  await shot("/review/ballots-in-river", "ai.png", '[data-tour="ai-suggestion"]');
  await shot("/review/ballots-in-river", "forensics.png", '[data-tour="forensics"]');
  await shot("/review/ballots-in-river", "verdict-form.png", '[data-tour="verdict-form"]');
  await page.goto(`${BASE}/demo/start?as=admin&next=/`);
  await shot("/review/analytics", "analytics.png");
  await shot("/review/analytics", "matrix.png", '[data-tour="analytics"]');
  await desktop.close();

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "light", reducedMotion: "reduce", isMobile: true });
  await phone.addInitScript(hideBanner);
  const phonePage = await phone.newPage();
  await phonePage.goto(BASE + "/", { waitUntil: "networkidle" });
  await phonePage.waitForTimeout(1500);
  await phonePage.screenshot({ path: new URL("mobile.png", SHOTS).pathname });
  console.log("  📸 mobile.png");
  await phone.close();

  // ── 2. The slides ─────────────────────────────────────────────────
  const img = async (file) => `data:image/png;base64,${(await readFile(new URL(file, SHOTS))).toString("base64")}`;
  const html = slides({
    home: await img("home.png"),
    submit: await img("submit.png"),
    progress: await img("progress.png"),
    result: await img("result.png"),
    queue: await img("queue.png"),
    board: await img("board.png"),
    ai: await img("ai.png"),
    forensics: await img("forensics.png"),
    verdictForm: await img("verdict-form.png"),
    analytics: await img("analytics.png"),
    matrix: await img("matrix.png"),
    mobile: await img("mobile.png"),
  });
  await writeFile(new URL("workflow.html", OUT_DIR), html);

  const printer = await browser.newPage();
  await printer.setContent(html, { waitUntil: "load" });
  await printer.pdf({ path: new URL("ElectionVerify-Workflow.pdf", OUT_DIR).pathname, width: "1280px", height: "720px", printBackground: true });
  await browser.close();
  console.log("✅ docs/ElectionVerify-Workflow.pdf");
}

const STEPS = [
  ["Read the content", "Opens the link safely (no private addresses) and extracts the article text."],
  ["Check the source", "Trusted-sources list, domain age (RDAP) and HTTPS."],
  ["Analyze the image", "Camera metadata, text in the image (OCR), earlier copies."],
  ["Find the claims", "Splits the content into checkable statements (Gemini or rules)."],
  ["Search fact-checks", "Google Fact Check Tools: published fact-checks of the same claim."],
  ["Gather evidence", "Tavily web search; each source marked supports / contradicts."],
  ["Prepare for review", "Suggested verdict with confidence and cited evidence IDs."],
];

function slides(s) {
  const page = (inner, cls = "") => `<section class="slide ${cls}"><div class="grid-bg"></div>${inner}<footer><span>ElectionVerify</span><span class="n"></span></footer></section>`;
  const flow = (items) =>
    `<div class="flow">${items.map(([t, d], i) => `<div class="node"><b>${String(i + 1).padStart(2, "0")}</b><h4>${t}</h4><p>${d}</p></div>`).join('<div class="arrow">→</div>')}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: 1280px 720px; margin: 0 }
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: -apple-system, "Segoe UI", Inter, Roboto, sans-serif; color: #e8ecf8; counter-reset: slide }
  .slide { width: 1280px; height: 720px; padding: 56px 64px; position: relative; overflow: hidden; page-break-after: always; counter-increment: slide;
    background: radial-gradient(900px 500px at 0% 0%, rgba(56,189,248,.18), transparent 60%), radial-gradient(800px 500px at 100% 0%, rgba(124,58,237,.18), transparent 60%), #0b1020 }
  .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px); background-size: 44px 44px; -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%) }
  .slide > *:not(.grid-bg) { position: relative }
  footer { position: absolute !important; left: 64px; right: 64px; bottom: 26px; display: flex; justify-content: space-between; font-size: 12px; color: #6b7aa6; letter-spacing: .08em; text-transform: uppercase }
  footer .n::after { content: counter(slide) }
  .eyebrow { font-size: 13px; letter-spacing: .25em; text-transform: uppercase; color: #5ec8ff; font-weight: 700; margin-bottom: 10px }
  h1 { font-size: 64px; line-height: 1.05; letter-spacing: -.02em }
  h2 { font-size: 40px; letter-spacing: -.02em; margin-bottom: 22px }
  .grad { color: #5ec8ff; text-shadow: 0 0 28px rgba(94,200,255,.45) }
  p, li { font-size: 18px; line-height: 1.55; color: #b7c1dc }
  ul { padding-left: 22px } li { margin: 6px 0 }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: start }
  .cols-60 { display: grid; grid-template-columns: 1.05fr 1fr; gap: 36px; align-items: center }
  .shot { width: 100%; max-height: 470px; object-fit: cover; object-position: top; border-radius: 14px; border: 1px solid rgba(94,200,255,.35); box-shadow: 0 30px 80px -30px rgba(56,189,248,.6) }
  .card { background: rgba(30,38,70,.55); border: 1px solid rgba(160,190,255,.15); border-radius: 14px; padding: 18px 20px }
  .card h3 { font-size: 20px; margin-bottom: 6px } .card p { font-size: 15px }
  .tag { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; margin: 3px 4px 3px 0 }
  .flow { display: flex; align-items: stretch; gap: 8px; margin-top: 10px }
  .node { flex: 1; background: rgba(30,38,70,.6); border: 1px solid rgba(94,200,255,.35); border-radius: 14px; padding: 14px; box-shadow: 0 0 30px -14px #38bdf8 }
  .node b { color: #5ec8ff; font-family: ui-monospace, monospace; font-size: 13px } .node h4 { font-size: 15px; margin: 6px 0 } .node p { font-size: 12.5px; line-height: 1.45 }
  .arrow { align-self: center; color: #5ec8ff; font-size: 22px }
  .steps { counter-reset: s; list-style: none; padding: 0 } .steps li { counter-increment: s; position: relative; padding-left: 46px; margin: 14px 0; font-size: 17px; min-height: 30px }
  .steps li::before { content: counter(s); position: absolute; left: 0; top: -1px; width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#38bdf8,#7c3aed); color: white; display: grid; place-items: center; font-weight: 700; font-size: 14px }
  table { width: 100%; border-collapse: collapse; font-size: 15px } td, th { text-align: left; padding: 9px 10px; border-bottom: 1px solid rgba(160,190,255,.12); color: #c9d2ea } th { color: #5ec8ff; font-size: 12px; letter-spacing: .12em; text-transform: uppercase }
  .arch { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 8px }
  .arch .card { min-height: 150px } .arch .k { color: #5ec8ff; font-size: 12px; letter-spacing: .15em; text-transform: uppercase; font-weight: 700 }
  .cover h1 { font-size: 78px } .logo { width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg,#38bdf8,#2563eb 55%,#7c3aed); display: grid; place-items: center; font-size: 34px; color: white; margin-bottom: 26px; box-shadow: 0 0 60px -10px #38bdf8 }
  .phone { height: 490px; border-radius: 28px; border: 1px solid rgba(94,200,255,.35); box-shadow: 0 30px 80px -30px rgba(56,189,248,.6) }
  </style></head><body>

  ${page(`<div class="cols-60 cover" style="height:100%"><div>
    <div class="logo">✓</div>
    <div class="eyebrow">Class project · Workflow overview</div>
    <h1>Election<span class="grad">Verify</span></h1>
    <p style="font-size:22px;margin-top:18px;max-width:520px">An AI-assisted platform where citizens check election news, messages and images before sharing them. Software gathers the evidence; a human reviewer decides.</p>
    <p style="margin-top:22px"><span class="tag" style="background:#d1fae5;color:#065f46">Accurate</span><span class="tag" style="background:#fef3c7;color:#92400e">Misleading</span><span class="tag" style="background:#fee2e2;color:#991b1b">False</span><span class="tag" style="background:#ede9fe;color:#5b21b6">Satire</span></p>
  </div><img class="shot" src="${s.home}"></div>`, "cover")}

  ${page(`<div class="eyebrow">Why</div><h2>The problem and our <span class="grad">solution</span></h2>
  <div class="cols"><div class="card"><h3>The problem</h3><ul>
    <li>False claims about voting dates, rules and results spread fast in group chats before elections.</li>
    <li>Old photos are reused with new, false captions.</li>
    <li>People have no quick, trustworthy way to check before forwarding.</li>
    <li>Fully automatic AI checking can be wrong, and confidently so.</li></ul></div>
  <div class="card"><h3>Our solution</h3><ul>
    <li>Anyone submits a <b>link, text or image</b> in seconds.</li>
    <li>An automatic <b>pipeline gathers evidence</b>: source reputation, fact-checks, web sources, image forensics.</li>
    <li>AI <b>suggests</b> a verdict with cited evidence, but a <b>human reviewer decides</b>.</li>
    <li>The public gets a clear rating plus the evidence, ready to share.</li></ul></div></div>`)}

  ${page(`<div class="eyebrow">Architecture</div><h2>How the system is <span class="grad">built</span></h2>
  <div class="arch">
    <div class="card"><div class="k">Frontend</div><h3>Next.js 16 + React 19</h3><p>App Router pages, Server Actions for forms, Tailwind CSS + shadcn/ui, 3D globe (cobe), charts (Recharts), evidence board (React Flow).</p></div>
    <div class="card"><div class="k">Server</div><h3>Data access layer</h3><p>One interface with two stores: in-memory demo data, or PostgreSQL via Prisma. Role checks (citizen / reviewer / admin) on every page and action.</p></div>
    <div class="card"><div class="k">Background</div><h3>Verification pipeline</h3><p>Seven steps run after each submission, with Inngest (retries) or Next.js after(). Progress is saved after every step.</p></div>
    <div class="card"><div class="k">Services</div><h3>Free external tools</h3><p>Supabase (login, database, storage), Gemini AI, Google Fact Check Tools, Tavily search, RDAP. Each one is optional.</p></div>
  </div>
  <div class="flow" style="margin-top:26px">
    <div class="node"><h4>Citizen</h4><p>Submit form</p></div><div class="arrow">→</div>
    <div class="node"><h4>Server Action</h4><p>Validate · limit · dedupe · save</p></div><div class="arrow">→</div>
    <div class="node"><h4>Pipeline</h4><p>Evidence + AI suggestion</p></div><div class="arrow">→</div>
    <div class="node"><h4>Reviewer</h4><p>Decides & publishes</p></div><div class="arrow">→</div>
    <div class="node"><h4>Public page</h4><p>Verdict + evidence + share</p></div></div>`)}

  ${page(`<div class="eyebrow">Under the hood</div><h2>The 7-step <span class="grad">verification pipeline</span></h2>
  ${flow(STEPS)}
  <div class="cols" style="margin-top:24px;grid-template-columns:1.2fr 1fr"><img class="shot" style="max-height:300px" src="${s.progress}">
  <div><p>Each step's status is stored as it runs, so the result page shows live progress. Required steps stop the pipeline if they fail; optional ones (fact-checks, web search) are skipped when their free API key isn't connected.</p>
  <p style="margin-top:12px">Without an AI key, built-in rules still find claims and suggest a cautious verdict, so the demo always works.</p></div></div>`)}

  ${page(`<div class="eyebrow">User workflow 1</div><h2>The <span class="grad">citizen</span></h2>
  <div class="cols-60"><ol class="steps">
    <li>Sees a doubtful WhatsApp forward, link or photo.</li>
    <li>Signs in and opens <b>Submit a claim</b>: Link, Text or Image tab.</li>
    <li>The form is checked; max 10 submissions per hour. Duplicates are linked to the existing check.</li>
    <li>Watches the <b>live progress</b> page while the evidence is gathered.</li>
    <li>Gets the <b>published verdict</b> with explanation and evidence; shares it to WhatsApp or downloads it as an image.</li>
    <li>Finds past checks under <b>My submissions</b> or searches <b>Verified claims</b>.</li></ol>
  <img class="shot" src="${s.submit}"></div>`)}

  ${page(`<div class="eyebrow">User workflow 2</div><h2>The <span class="grad">reviewer</span></h2>
  <div class="cols-60"><div><ol class="steps">
    <li>Opens the <b>review queue</b>: sort by newest or most reported, move with J / K.</li>
    <li>Reads the content, claims and every piece of evidence.</li>
    <li>Checks the <b>AI suggestion</b>: confidence gauge and clickable citations (fake citations turn red).</li>
    <li>Explores the <b>evidence board</b> and <b>image forensics</b>; can add evidence found by hand.</li>
    <li>Picks a rating (keys 1–6), writes a public explanation, and <b>publishes</b>.</li></ol></div>
  <img class="shot" src="${s.queue}"></div>`)}

  ${page(`<div class="eyebrow">Reviewer tools</div><h2>Evidence board and <span class="grad">AI suggestion</span></h2>
  <div class="cols" style="grid-template-columns:1.5fr 1fr"><img class="shot" src="${s.board}"><div><img class="shot" src="${s.ai}"><p style="margin-top:14px;font-size:15px">Green links support a claim, red links contradict it. The AI's suggestion is never shown to the public.</p></div></div>`)}

  ${page(`<div class="eyebrow">Reviewer tools</div><h2>Image <span class="grad">forensics</span></h2>
  <div class="cols-60"><img class="shot" src="${s.forensics}"><div><ul>
    <li><b>Text in the image</b> (OCR with Tesseract) is boxed directly on the photo, e.g. “SPECIMEN”.</li>
    <li><b>Metadata</b>: camera, date taken, editing software. GPS is detected but never shown.</li>
    <li><b>Perceptual fingerprint</b> spots the same photo even after resizing or WhatsApp compression.</li>
    <li><b>Compare slider</b> and one-click reverse search (Google Lens, TinEye) for older copies.</li></ul></div></div>`)}

  ${page(`<div class="eyebrow">Outcome</div><h2>The public <span class="grad">verdict</span></h2>
  <div class="cols-60"><img class="shot" src="${s.result}"><div><ul>
    <li>Six ratings: Accurate, Misleading, Missing context, False, Unverified, Satire.</li>
    <li>Plain-language explanation and the date of the human review.</li>
    <li>Evidence map and evidence list with links to every source.</li>
    <li>Share buttons, downloadable verdict image, and link previews that show the verdict.</li>
    <li>Available in <b>English, Hindi and Urdu</b>.</li></ul></div></div>`)}

  ${page(`<div class="eyebrow">User workflow 3</div><h2>The <span class="grad">admin</span> and analytics</h2>
  <div class="cols" style="grid-template-columns:1.35fr 1fr"><img class="shot" src="${s.analytics}"><div><ul>
    <li><b>Analytics</b>: claims per day, published verdicts, median review time.</li>
    <li><b>AI vs. reviewer</b> grid: how often humans agreed with the AI, and where they corrected it.</li>
    <li><b>Trusted sources</b>: official, news, fact-checker, satire and known-false websites.</li>
    <li><b>Activity log</b> of every submission, verdict and change.</li>
    <li><b>Setup</b> page showing which free services are connected.</li></ul></div></div>`)}

  ${page(`<div class="eyebrow">Trust</div><h2>Safety and <span class="grad">security</span></h2>
  <div class="arch" style="grid-template-columns:repeat(3,1fr)">
    <div class="card"><h3>Human in the loop</h3><p>AI verdicts are stored separately and never published. A reviewer decides every result.</p></div>
    <div class="card"><h3>Checked citations</h3><p>Every AI statement must cite real evidence IDs; invented ones are flagged in red.</p></div>
    <div class="card"><h3>Prompt-injection guard</h3><p>Submitted text is wrapped and treated as data, never as instructions to the AI.</p></div>
    <div class="card"><h3>Safe link fetching</h3><p>Blocks private and internal addresses (SSRF), limits size, time and redirects.</p></div>
    <div class="card"><h3>Privacy</h3><p>Submitters are never shown, GPS is hidden, images are stored privately with expiring links.</p></div>
    <div class="card"><h3>Abuse limits & audit</h3><p>Sign-in to submit, 10 per hour, duplicate detection, server-side validation and a full activity log.</p></div></div>`)}

  ${page(`<div class="eyebrow">Built with</div><h2>Tech stack, <span class="grad">all free</span></h2>
  <div class="cols-60"><table>
    <tr><th>Layer</th><th>Tools</th></tr>
    <tr><td>Framework</td><td>Next.js 16, React 19, TypeScript</td></tr>
    <tr><td>Design</td><td>Tailwind CSS 4, shadcn/ui, cobe globe, Recharts, React Flow</td></tr>
    <tr><td>Data</td><td>PostgreSQL + Prisma 7 (Supabase free tier)</td></tr>
    <tr><td>Login & files</td><td>Supabase Auth and Storage</td></tr>
    <tr><td>Pipeline</td><td>Inngest, Readability, RDAP, exifr, Tesseract OCR, sharp</td></tr>
    <tr><td>AI & search</td><td>Gemini, Google Fact Check Tools, Tavily</td></tr>
    <tr><td>Quality</td><td>Vitest (68 tests), Playwright (8 browser tests), GitHub Actions</td></tr>
  </table><img class="phone" src="${s.mobile}" style="justify-self:center"></div>`)}

  ${page(`<div class="eyebrow">Live demo</div><h2>How to <span class="grad">run it</span></h2>
  <div class="cols"><div class="card"><h3>Start</h3><p style="font-family:ui-monospace,monospace;font-size:15px;color:#e8ecf8">npm install<br>npm run dev</p>
    <p style="margin-top:10px">Open http://localhost:3000. Demo mode works without any accounts: sample data, and sign-in by picking a role.</p>
    <h3 style="margin-top:16px">Presenter mode</h3><p>Click “Watch the guided demo” on the home page (or Ctrl/⌘+K → Start presenter mode). A 12-step tour walks through the citizen, reviewer and admin views.</p></div>
  <div class="card"><h3>Going live</h3><ul style="font-size:16px">
    <li>Add free keys in <b>.env</b>: Supabase, Gemini, Fact Check, Tavily.</li>
    <li><b>npm run check:services</b> tests each key.</li>
    <li><b>npm run db:migrate</b> and <b>db:seed</b> create the database.</li>
    <li>Deploy free on Vercel.</li></ul>
    <h3 style="margin-top:16px">Thank you!</h3><p>Questions?</p></div></div>`)}
  </body></html>`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
