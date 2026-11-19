/**
 * Records video/intro.html into an MP4, frame by frame, so the animation is
 * perfectly smooth no matter how fast this computer is.
 *
 *   npm run video                      → public/videos/electionverify-intro.mp4 (+ poster.jpg)
 *   npm run video -- --stills 3,12,40  → PNG stills of those seconds in video/stills/ (for checking)
 *
 * Needs ffmpeg (brew install ffmpeg) and Playwright's Chromium (npx playwright install chromium).
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const page_url = `${pathToFileURL(resolve(root, "video/intro.html")).href}?record=1`;
const stillsArg = process.argv.indexOf("--stills");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(page_url);
await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode().catch(() => {}))));
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);

if (stillsArg !== -1) {
  const times = process.argv[stillsArg + 1].split(",").map(Number);
  mkdirSync(resolve(root, "video/stills"), { recursive: true });
  for (const t of times) {
    await page.evaluate((time) => window.render(time), t);
    await page.screenshot({ path: resolve(root, `video/stills/t${String(t).padStart(5, "0")}.png`) });
    console.log(`still at ${t}s`);
  }
  await browser.close();
  process.exit(0);
}

const outDir = resolve(root, "public/videos");
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, "electionverify-intro.mp4");
const ffmpeg = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
  "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  out,
], { stdio: ["pipe", "inherit", "inherit"] });

const total = Math.round(duration * FPS);
const started = Date.now();
for (let i = 0; i < total; i++) {
  await page.evaluate((time) => window.render(time), i / FPS);
  const frame = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ffmpeg.stdin.write(frame)) await new Promise((ok) => ffmpeg.stdin.once("drain", ok));
  if (i % (FPS * 5) === 0) console.log(`frame ${i}/${total} (${Math.round((Date.now() - started) / 1000)}s)`);
}
ffmpeg.stdin.end();
await new Promise((ok, fail) => ffmpeg.on("close", (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)))));

// A poster image for the video player (the title frame).
await page.evaluate(() => window.render(3.2));
await page.screenshot({ path: resolve(outDir, "electionverify-intro-poster.jpg"), type: "jpeg", quality: 85 });
await browser.close();
console.log(`Saved ${out}`);
