/**
 * Records a narrated walkthrough of the real app: how a citizen, a reviewer and an
 * admin use ElectionVerify. A browser clicks through the app in demo mode while
 * captions and a voice-over explain each step.
 *
 * 1. Start the app in demo mode on port 3300 (no keys, sample data):
 *      DATABASE_URL= NEXT_PUBLIC_SUPABASE_URL= GEMINI_API_KEY= … npm run build && npm start -- -p 3300
 *    (".claude/launch.json" has this as the "demo" configuration.)
 * 2. npm run video:walkthrough   → docs/ElectionVerify-Walkthrough.mp4
 *
 * With a 3D presenter character (needs Blender; see scripts/presenter.py):
 *      PRESENTER_BLEND=path/to/character.blend npm run video:walkthrough
 *    → docs/ElectionVerify-Walkthrough-Presenter.mp4, with the character talking in the corner.
 *
 * Needs ffmpeg, Playwright's Chromium, and edge-tts for the voice
 * (python3 -m venv .venv-tts && .venv-tts/bin/pip install edge-tts).
 * The demo server keeps its data in memory, so restart it before recording again.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3300";
const W = 1600;
const H = 900;
const dir = resolve(root, "video/walkthrough");
const voiceDir = resolve(dir, "voice");
const PRESENTER = process.env.PRESENTER_BLEND ? resolve(process.env.PRESENTER_BLEND) : null;
const BLENDER = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";
const FPS = 25;
// With the cartoon presenter the narrator gets a squeaky, fast cartoon voice and funnier lines
// (VOICE_STYLE=plain keeps the normal voice).
const CARTOON = Boolean(PRESENTER) && process.env.VOICE_STYLE !== "plain";
const VOICE = CARTOON ? "en-US-GuyNeural" : "en-IN-NeerjaNeural";
const RATE = CARTOON ? "+12%" : "+6%";
const PITCH = CARTOON ? "+30Hz" : "+0Hz";
const VOICE_FILTER = CARTOON ? "asetrate=24000*1.55,aresample=24000,atempo=0.72,equalizer=f=3000:t=q:w=1:g=3,volume=1.4,alimiter=limit=0.89:level=false" : null;
const output = resolve(root, PRESENTER ? "docs/ElectionVerify-Walkthrough-Presenter.mp4" : "docs/ElectionVerify-Walkthrough.mp4");

/** Everything the narrator says, in order. `role` colours the caption. */
const LINES = {
  intro: { role: null, text: "This is ElectionVerify. During elections, fake news spreads fast on WhatsApp. Anyone can send us a suspicious claim, the system gathers the evidence, and a trained human reviewer publishes the verdict. Let's see how the citizen, the reviewer and the admin each use it." },
  citizenCard: { role: "citizen", text: "Part one. The citizen." },
  home: { role: "citizen", text: "The home page shows live numbers: claims sent in, verdicts published, and claims waiting for a reviewer. Every tile opens the real page." },
  verified: { role: "citizen", text: "Anyone can search verdicts that are already published. No sign-in needed." },
  signin: { role: "citizen", text: "To send a new claim, the citizen signs in with Google or an email link. No passwords. Here we use the demo citizen account." },
  drop: { role: "citizen", text: "A relative forwarded this message in the family WhatsApp group. The citizen simply drags the screenshot onto the page." },
  submit: { role: "citizen", text: "The form opens with the photo attached. They add where they saw it, and press submit." },
  progress: { role: "citizen", text: "Now the checks run by themselves. The text in the photo is read, the claims in it are picked out, and fact-checkers and trusted sources are searched. The citizen can watch each step live." },
  waiting: { role: "citizen", text: "When the evidence is ready, the claim waits for a human reviewer. The verdict will appear on this same page, and every claim they sent is listed under My claims." },
  reviewerCard: { role: "reviewer", text: "Part two. The reviewer." },
  board: { role: "reviewer", text: "Reviewers work on a board. New claims are still being checked, then they need review, then someone reviews them, and finally they're published." },
  drag: { role: "reviewer", text: "The reviewer drags the new claim into In review. It's now assigned to them, so two reviewers never work on the same claim." },
  evidence: { role: "reviewer", text: "The claim page shows everything the system found: the text read from the photo, image checks, matching fact-checks and sources, and an AI suggestion, which is only a hint." },
  verdict: { role: "reviewer", text: "The reviewer makes the final call. This claim is false: polling hours were not changed, and everyone in the queue at closing time can still vote. They write a short public explanation and publish." },
  published: { role: "reviewer", text: "The verdict is now public. Anyone can read the explanation and the evidence, and share the link back into the WhatsApp group." },
  adminCard: { role: "admin", text: "Part three. The admin." },
  people: { role: "admin", text: "The admin manages people. Everyone starts as a citizen, and the admin makes trusted people reviewers, right here." },
  sources: { role: "admin", text: "Admins also keep the list of trusted sources, which decides how much evidence from each website counts." },
  analytics: { role: "admin", text: "Analytics show how many claims arrive, how fast they're reviewed, and which verdicts are most common." },
  activity: { role: "admin", text: "And every important action is written to the activity log, so the team stays accountable." },
  outro: { role: null, text: "That's ElectionVerify. Citizens report, the system gathers evidence, humans decide, and everyone can check before they share." },
};

/** The same story in the cartoon presenter's voice: playful, but still explains every step. */
const CARTOON_LINES = {
  intro: "Bello! I'm your little yellow guide. During elections, fake news spreads super fast on WhatsApp. Ooh, dangerous! With ElectionVerify, anyone can send a suspicious claim, the system gathers the evidence, and a real human reviewer gives the verdict. Let's go see the citizen, the reviewer, and the admin!",
  citizenCard: "Part one. The citizen! Hee hee.",
  home: "This is the home page. Real, live numbers: claims sent in, verdicts published, and claims waiting for a reviewer. Click any tile, and it opens the real page!",
  verified: "Anyone can search the verdicts that are already published. No sign-in. Easy peasy!",
  signin: "To send a new claim, the citizen signs in with Google or an email link. No passwords! I always forget them anyway.",
  drop: "Uh oh. Somebody forwarded this message in the family WhatsApp group. Very suspicious! The citizen just drags the screenshot onto the page.",
  submit: "The form opens with the photo already attached. Add where you saw it, and press submit. Boop!",
  progress: "Now the machines do the boring work! They read the text in the photo, find the claims, and search fact-checkers and trusted sources. The citizen can watch every step, live.",
  waiting: "Evidence ready! Now a human reviewer will decide. The verdict appears right here, and all your claims are listed under My claims.",
  reviewerCard: "Part two. The reviewer!",
  board: "Reviewers work on a board. New claims are still being checked, then they need review, then someone reviews them, and then, ta-da, published!",
  drag: "The reviewer drags the new claim into In review. Now it's theirs, so two reviewers never fight over the same claim. No fighting!",
  evidence: "The claim page shows everything the system found: the text from the photo, image checks, fact-checks, trusted sources, and an AI suggestion. But the AI only gives a hint!",
  verdict: "The human makes the final call. This claim is false! Polling hours did not change, and everyone in the queue at closing time can still vote. Write a short explanation, and publish!",
  published: "Now the verdict is public! Anyone can read it, see the evidence, and share the link right back into that WhatsApp group. Ha ha!",
  adminCard: "Part three. The admin, the big boss!",
  people: "The admin manages people. Everyone starts as a citizen, and the boss makes trusted people reviewers, right here.",
  sources: "The admin also keeps the list of trusted sources. It decides how much each website's evidence counts.",
  analytics: "Analytics show how many claims come in, how fast they're reviewed, and which verdicts are most common. Ooh, charts!",
  activity: "And every important action is written in the activity log, so everybody stays honest.",
  outro: "That's ElectionVerify! Citizens report, the system gathers evidence, humans decide, and everyone checks before they share. Poopaye!",
};
if (CARTOON) for (const [id, text] of Object.entries(CARTOON_LINES)) LINES[id].text = text;

// ── 1. Voice-over: one clip per line (cached until the text changes) ──────────
mkdirSync(voiceDir, { recursive: true });
const EDGE_TTS = resolve(root, ".venv-tts/bin/edge-tts");
const cacheFile = resolve(voiceDir, "cache.json");
const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
const durations = {};
for (const [id, line] of Object.entries(LINES)) {
  const mp3 = resolve(voiceDir, `${id}.mp3`);
  const key = `${VOICE}|${RATE}|${PITCH}|${VOICE_FILTER}|${line.text}`;
  if (cache[id] !== key || !existsSync(mp3)) {
    for (let attempt = 1; ; attempt++) {
      try {
        const spoken = VOICE_FILTER ? mp3.replace(/\.mp3$/, ".raw.mp3") : mp3;
        execFileSync(EDGE_TTS, ["--voice", VOICE, `--rate=${RATE}`, `--pitch=${PITCH}`, "--text", line.text, "--write-media", spoken], { stdio: "ignore" });
        if (VOICE_FILTER) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", spoken, "-af", VOICE_FILTER, mp3]);
        break;
      } catch (error) {
        if (attempt >= 5) throw error;
      }
    }
    cache[id] = key;
  }
  durations[id] = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString());
}
writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
console.log(`Voice-over ready: ${Object.values(durations).reduce((a, b) => a + b, 0).toFixed(0)} s of speech.`);

// ── 2. Record the browser ───────────────────────────────────────────────────
const rawDir = resolve(dir, "raw");
rmSync(rawDir, { recursive: true, force: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: rawDir, size: { width: W, height: H } },
  colorScheme: "light",
});
await context.addInitScript(overlayScript, { presenter: Boolean(PRESENTER) });
const page = await context.newPage();
const t0 = Date.now();
const spoken = []; // { id, at } seconds into the video

const wait = (ms) => page.waitForTimeout(ms);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Shows the caption, speaks the line, and runs `actions` at the same time. */
async function say(id, actions = async () => {}, { card = false } = {}) {
  const line = LINES[id];
  await page.evaluate(([text, role, card]) => window.__wt?.caption(text, role, card), [line.text, line.role, card]);
  spoken.push({ id, at: (Date.now() - t0) / 1000 });
  await Promise.all([sleep(durations[id] * 1000 + 450), actions()]);
}
async function clearCard() {
  await page.evaluate(() => window.__wt?.caption("", null, false));
}

async function pointAt(locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return null;
  const x = box.x + Math.min(box.width / 2, 60);
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: 28 });
  return { x, y, box };
}
async function click(locator) {
  await pointAt(locator);
  await wait(250);
  await locator.click();
}
async function typeInto(locator, text) {
  await click(locator);
  await locator.pressSequentially(text, { delay: 28 });
}
async function smoothScroll(to, ms = 1800) {
  await page.evaluate(
    ([to, ms]) =>
      new Promise((done) => {
        const from = window.scrollY;
        const target = typeof to === "number" ? to : document.documentElement.scrollHeight - innerHeight;
        const start = performance.now();
        const step = (now) => {
          const k = Math.min(1, (now - start) / ms);
          window.scrollTo(0, from + (target - from) * (0.5 - Math.cos(Math.PI * k) / 2));
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      }),
    [to, ms],
  );
}
async function go(path) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await wait(400);
}
async function signInAs(role, next) {
  await page.context().clearCookies();
  await go(`/demo/start?as=${role}&next=${encodeURIComponent(next)}`);
}

try {
  // Intro
  await go("/");
  await say("intro", async () => {}, { card: true });
  await clearCard();

  // ── Citizen ──
  await say("citizenCard", async () => {}, { card: true });
  await clearCard();
  await say("home", async () => {
    await wait(600);
    await smoothScroll(520, 2200);
    await pointAt(page.locator("a[href='/verified']").filter({ hasText: /\d/ }).first()).catch(() => {});
  });

  await go("/verified");
  await say("verified", async () => {
    await typeInto(page.getByRole("searchbox").or(page.locator("input[name=q]")).first(), "polling");
    await page.keyboard.press("Enter");
    await page.waitForURL(/q=polling/);
    await wait(900);
    await smoothScroll(300, 1400);
  });

  await page.context().clearCookies();
  await go("/login?next=%2Fsubmit");
  await say("signin", async () => {
    await wait(1800);
    await click(page.getByRole("button", { name: /Continue as Citizen/ }));
    await page.waitForURL((url) => url.pathname !== "/login");
  });

  // Drag the screenshot onto the page (the same events a real drag from the desktop sends).
  await go("/");
  const png = readFileSync(resolve(dir, "forwarded-message.png")).toString("base64");
  await say("drop", async () => {
    await page.evaluate(() => window.__wt?.showFile(true));
    await page.mouse.move(W - 260, H - 220, { steps: 1 });
    await page.mouse.move(W / 2, H / 2, { steps: 40 });
    await page.evaluate(async (b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const file = new File([bytes], "forwarded-message.png", { type: "image/png" });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      window.dispatchEvent(new DragEvent("dragenter", { dataTransfer: transfer, bubbles: true }));
      window.dispatchEvent(new DragEvent("dragover", { dataTransfer: transfer, bubbles: true, cancelable: true }));
      window.__wtTransfer = transfer;
    }, png);
    await wait(1600);
    await page.evaluate(() => {
      window.__wt?.showFile(false);
      document.body.dispatchEvent(new DragEvent("drop", { dataTransfer: window.__wtTransfer, bubbles: true, cancelable: true }));
    });
    await page.waitForURL(/\/submit/);
  });

  await say("submit", async () => {
    await wait(700);
    await typeInto(page.locator("#caption"), "Forwarded in our family WhatsApp group this morning");
    await wait(300);
    await click(page.getByRole("button", { name: "Submit for checking" }));
    await page.waitForURL(/\/s\/[\w-]+/);
  });
  const claimId = new URL(page.url()).pathname.split("/").pop();

  await say("progress", async () => {
    await wait(1200);
    await pointAt(page.getByText(/Reading|text in the image|Checking/i).first()).catch(() => {});
  });
  await page.getByText("Evidence collected, waiting for a reviewer").waitFor({ timeout: 90_000 });
  await say("waiting", async () => {
    await wait(3000);
    await go("/my");
    await pointAt(page.locator(`a[href^='/s/${claimId}']`).first()).catch(() => {});
  });

  // ── Reviewer ──
  await say("reviewerCard", async () => {}, { card: true });
  await clearCard();
  await signInAs("reviewer", "/review?view=board");
  await say("board", async () => {
    await page.locator("[data-tour='board']").scrollIntoViewIfNeeded();
    await smoothScroll((await page.locator("[data-tour='board']").boundingBox()).y + (await page.evaluate(() => scrollY)) - 90, 1500);
    for (const id of ["new", "open", "review", "done"]) await pointAt(page.locator(`[data-column='${id}'] header`));
  });

  const card = page.locator(`[data-column] li`).filter({ has: page.locator(`a[href='/review/${claimId}']`) }).first();
  await say("drag", async () => {
    const from = await pointAt(card);
    const to = await page.locator("[data-column='review'] header").boundingBox();
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y + 12, { steps: 4 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height + 40, { steps: 40 });
    await wait(300);
    await page.mouse.up();
    await page.locator("[data-column='review']").getByText("You’re reviewing").first().waitFor();
    await wait(800);
  });

  await go(`/review/${claimId}`);
  await say("evidence", async () => {
    await wait(800);
    await smoothScroll(700, 3000);
    await wait(800);
    await smoothScroll(1500, 3000);
  });

  await say("verdict", async () => {
    await page.locator("#verdict").scrollIntoViewIfNeeded();
    await click(page.locator("#verdict-FALSE"));
    await typeInto(
      page.getByLabel("Public explanation"),
      "False. The Election Commission has not changed polling hours. Booths stay open until the announced closing time, and everyone in the queue then can still vote.",
    );
    await wait(400);
    await click(page.getByRole("button", { name: "Publish verdict" }));
    await page.waitForURL(/notice=published/);
  });

  await go(`/s/${claimId}`);
  await say("published", async () => {
    await wait(1500);
    await smoothScroll(600, 2600);
  });

  // ── Admin ──
  await say("adminCard", async () => {}, { card: true });
  await clearCard();
  await signInAs("admin", "/admin/users");
  await say("people", async () => {
    const row = page.getByRole("row").filter({ hasText: "citizen@demo.local" });
    await pointAt(row);
    await wait(500);
    await click(row.getByLabel("Role"));
    await row.getByLabel("Role").selectOption("REVIEWER");
    await wait(400);
    await click(row.getByRole("button", { name: "Save" }));
    await row.getByText("Saved").waitFor();
  });

  await go("/admin/sources");
  await say("sources", async () => {
    await wait(800);
    await smoothScroll(500, 2600);
  });

  await go("/review/analytics");
  await say("analytics", async () => {
    await wait(800);
    await smoothScroll(600, 3000);
  });

  await go("/admin/activity");
  await say("activity", async () => {
    await wait(800);
    await pointAt(page.getByText(/Published a verdict|Changed a person's role/).first()).catch(() => {});
  });

  await go("/");
  await say("outro", async () => {}, { card: true });
  await wait(800);
} finally {
  await page.close();
  await context.close();
  await browser.close();
}

// ── 3. Put it together: video + voice-over at the right moments ──────────────
const raw = execFileSync("ls", [rawDir]).toString().trim().split("\n").find((f) => f.endsWith(".webm"));
const rawVideo = resolve(rawDir, raw);
const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", rawVideo]).toString());

// The voice track on its own.
const voiceTrack = resolve(dir, "voice.wav");
const voiceInputs = [];
const voiceFilters = [];
spoken.forEach((s, i) => {
  voiceInputs.push("-i", resolve(voiceDir, `${s.id}.mp3`));
  const ms = Math.round(s.at * 1000);
  voiceFilters.push(`[${i}:a]adelay=${ms}|${ms},apad[a${i}]`);
});
voiceFilters.push(`${spoken.map((_, i) => `[a${i}]`).join("")}amix=inputs=${spoken.length}:normalize=0:duration=longest,atrim=0:${duration.toFixed(2)}[voice]`);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...voiceInputs, "-filter_complex", voiceFilters.join(";"), "-map", "[voice]", "-ar", "24000", "-ac", "1", voiceTrack]);

// When each line is spoken, and how loud the voice is in every video frame (it moves the presenter's mouth).
const pcm = execFileSync("ffmpeg", ["-loglevel", "error", "-i", voiceTrack, "-f", "s16le", "-ac", "1", "-ar", "8000", "-"], { maxBuffer: 1 << 28 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2);
const per = 8000 / FPS;
const rms = [];
for (let f = 0; f * per < samples.length; f++) {
  let sum = 0;
  const end = Math.min(samples.length, (f + 1) * per);
  for (let i = f * per; i < end; i++) sum += samples[i] * samples[i];
  rms.push(Math.sqrt(sum / Math.max(1, end - f * per)));
}
const loudest = [...rms].sort((a, b) => a - b)[Math.floor(rms.length * 0.97)] || 1;
const loudness = rms.map((v) => (v < loudest * 0.06 ? 0 : Math.round(Math.min(1, (v / loudest) ** 0.8) * 1000) / 1000));
const cards = new Set(["intro", "citizenCard", "reviewerCard", "adminCard", "outro"]);
const lines = spoken.map((s) => ({ id: s.id, at: s.at, dur: durations[s.id] + 0.45, card: cards.has(s.id) }));
const timelineFile = resolve(dir, "timeline.json");
writeFileSync(timelineFile, JSON.stringify({ fps: FPS, duration, lines, loudness }));

// The presenter: rendered by Blender as transparent frames.
const presenterDir = resolve(dir, "presenter");
if (PRESENTER) {
  rmSync(presenterDir, { recursive: true, force: true });
  console.log("Rendering the presenter in Blender (this takes a while)…");
  execFileSync(BLENDER, ["-b", "--disable-autoexec", PRESENTER, "--python", resolve(root, "scripts/presenter.py"), "--",
    "--timeline", timelineFile, "--out", presenterDir], { stdio: ["ignore", "ignore", "inherit"] });
}

const filters = [`[0:v]scale=1920:1080:flags=lanczos,fps=${FPS}[base]`];
const inputs = ["-i", rawVideo, "-i", voiceTrack];
if (PRESENTER) {
  inputs.push("-framerate", String(FPS), "-start_number", "1", "-i", resolve(presenterDir, "f%04d.png"));
  // Small in the bottom-right corner, big on the left during the title cards.
  const onCard = lines.filter((l) => l.card).map((l) => `between(t,${(l.at - 0.3).toFixed(2)},${(l.at + l.dur + 0.5).toFixed(2)})`).join("+");
  filters.push(`[2:v]split[p1][p2]`);
  filters.push(`[p1]scale=-1:420[small]`);
  filters.push(`[p2]scale=-1:860[big]`);
  filters.push(`[base][small]overlay=x=W-w-6:y=H-h+24:enable='not(${onCard})'[s1]`);
  filters.push(`[s1][big]overlay=x=150:y=(H-h)/2+40:enable='${onCard}',format=yuv420p[v]`);
} else {
  filters.push(`[base]format=yuv420p[v]`);
}
mkdirSync(dirname(output), { recursive: true });
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", ...inputs,
  "-filter_complex", filters.join(";"),
  "-map", "[v]", "-map", "1:a", "-t", duration.toFixed(2),
  "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
  output,
], { stdio: "inherit" });
// Long silent waits (for example while a photo is being checked) are cut down to a few seconds.
const KEEP = 2;
const cuts = [];
for (let i = 1; i < lines.length; i++) {
  const end = lines[i - 1].at + lines[i - 1].dur;
  if (lines[i].at - end > 3 * KEEP) cuts.push([end + KEEP, lines[i].at - KEEP]);
}
if (cuts.length) {
  const keep = [];
  let from = 0;
  for (const [a, b] of cuts) {
    keep.push([from, a]);
    from = b;
  }
  keep.push([from, duration]);
  const parts = keep.map(([a, b], i) =>
    `[0:v]trim=${a.toFixed(2)}:${b.toFixed(2)},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=${a.toFixed(2)}:${b.toFixed(2)},asetpts=PTS-STARTPTS[a${i}]`);
  const trimmed = output.replace(/\.mp4$/, ".trimmed.mp4");
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", output,
    "-filter_complex", `${parts.join(";")};${keep.map((_, i) => `[v${i}][a${i}]`).join("")}concat=n=${keep.length}:v=1:a=1[v][a]`,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
    trimmed,
  ], { stdio: "inherit" });
  renameSync(trimmed, output);
  console.log(`Cut ${cuts.map(([a, b]) => `${(b - a).toFixed(0)} s`).join(", ")} of waiting.`);
}
console.log(`Saved ${output}`);

// ── The caption bar, title cards, and a visible mouse pointer ────────────────
function overlayScript(options) {
  const presenter = Boolean(options?.presenter);
  const COLORS = { citizen: "#c8f169", reviewer: "#ff9b7a", admin: "#8fd3ff" };
  const NAMES = { citizen: "Citizen", reviewer: "Reviewer", admin: "Admin" };
  function mount() {
    if (document.getElementById("__wt")) return;
    const style = document.createElement("style");
    style.textContent = `
      [data-demo-banner]{display:none!important}
      #__wt{position:fixed;inset:0;pointer-events:none;z-index:2147483647;font-family:Inter,system-ui,sans-serif}
      #__wt .cap{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);max-width:1120px;width:max-content;
        background:rgba(12,16,14,.88);color:#fff;border-radius:22px;padding:14px 22px;font-size:21px;line-height:1.4;
        box-shadow:0 20px 50px -20px rgba(0,0,0,.6);display:flex;gap:14px;align-items:flex-start;transition:opacity .3s}
      #__wt .cap.hide{opacity:0}
      #__wt .pill{flex:none;border-radius:999px;padding:3px 12px;font-size:14px;font-weight:800;color:#111;margin-top:3px}
      #__wt .card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;
        background:radial-gradient(circle at 30% 20%,#25402f,#0c100e 70%);color:#fff;text-align:center;transition:opacity .5s;padding:80px}
      #__wt .card.hide{opacity:0}
      #__wt .card h1{font-size:64px;font-weight:800;letter-spacing:-.02em;margin:0}
      #__wt .card p{font-size:26px;opacity:.85;max-width:1000px;line-height:1.45;margin:0}
      #__wt .card .roles{display:flex;gap:12px}
      #__wt .ptr{position:absolute;left:0;top:0;width:26px;height:26px;transform:translate(-4px,-3px);transition:transform .04s linear}
      #__wt .ptr svg{filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
      #__wt .ring{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #c8f169;opacity:0}
      #__wt .ring.go{animation:wtring .5s ease-out}
      @keyframes wtring{from{opacity:1;transform:scale(.4)}to{opacity:0;transform:scale(1.4)}}
      #__wt .file{position:absolute;width:150px;transform:translate(-30px,-40px) rotate(-6deg);border-radius:12px;overflow:hidden;
        box-shadow:0 20px 40px -10px rgba(0,0,0,.5);border:3px solid #fff;display:none}
      #__wt .file.on{display:block}
      #__wt.with-presenter .cap{left:calc(50% - 140px);max-width:1040px}
      #__wt.with-presenter .card{padding-left:660px;padding-right:70px}
      #__wt.with-presenter .card p{max-width:820px}`;
    const host = document.createElement("div");
    host.id = "__wt";
    host.innerHTML = `<div class="card hide"></div><div class="cap hide"></div><div class="file"><img src="data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="120"><rect width="150" height="120" fill="#e5ddd5"/><rect width="150" height="22" fill="#075e54"/><rect x="10" y="32" width="130" height="78" rx="8" fill="#fff"/><rect x="18" y="44" width="100" height="6" fill="#999"/><rect x="18" y="58" width="114" height="6" fill="#b00"/><rect x="18" y="72" width="90" height="6" fill="#999"/><rect x="18" y="86" width="108" height="6" fill="#999"/></svg>',
    )}" width="150"></div><div class="ring"></div><div class="ptr"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l16 10-7 1.5L9.5 21z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div>`;
    document.documentElement.append(style, host);
    if (presenter) host.classList.add("with-presenter");
    const ptr = host.querySelector(".ptr");
    const ring = host.querySelector(".ring");
    const file = host.querySelector(".file");
    const place = (x, y) => {
      ptr.style.transform = `translate(${x - 4}px,${y - 3}px)`;
      file.style.left = `${x}px`;
      file.style.top = `${y}px`;
      sessionStorage.setItem("__wtPos", JSON.stringify([x, y]));
    };
    const saved = JSON.parse(sessionStorage.getItem("__wtPos") ?? "[800,450]");
    place(saved[0], saved[1]);
    addEventListener("mousemove", (e) => place(e.clientX, e.clientY), true);
    addEventListener("mousedown", (e) => {
      ring.style.left = `${e.clientX}px`;
      ring.style.top = `${e.clientY}px`;
      ring.classList.remove("go");
      void ring.offsetWidth;
      ring.classList.add("go");
    }, true);
    const render = (state) => {
      const cap = host.querySelector(".cap");
      const card = host.querySelector(".card");
      const pill = state.role ? `<span class="pill" style="background:${COLORS[state.role]}">${NAMES[state.role]}</span>` : "";
      if (state.card) {
        const roles = ["citizen", "reviewer", "admin"].map((r) => `<span class="pill" style="background:${COLORS[r]}">${NAMES[r]}</span>`).join("");
        const title = state.role ? NAMES[state.role] : "ElectionVerify";
        card.innerHTML = `<div class="roles">${state.role ? pill : roles}</div><h1>${title}</h1><p>${state.text}</p>`;
        card.classList.remove("hide");
        cap.classList.add("hide");
      } else {
        card.classList.add("hide");
        cap.innerHTML = `${pill}<span>${state.text}</span>`;
        cap.classList.toggle("hide", !state.text);
      }
    };
    window.__wt = {
      caption(text, role, card) {
        const state = { text, role, card };
        sessionStorage.setItem("__wtCap", JSON.stringify(state));
        render(state);
      },
      showFile(on) {
        file.classList.toggle("on", on);
      },
    };
    const last = sessionStorage.getItem("__wtCap");
    if (last) render(JSON.parse(last));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
}
