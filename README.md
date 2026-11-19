# ElectionVerify

**An AI-assisted platform for checking election information.** Citizens submit a news link, a forwarded
message or an image. The system gathers evidence (source reputation, existing fact-checks, supporting and
contradicting sources, image metadata and text in images), and a **human reviewer** decides and publishes
the verdict.

> The AI only suggests. Nothing is published without a person checking it.

**Live:** [election-verify.vercel.app](https://election-verify.vercel.app) ·
**Code:** [github.com/abdullahrizwan7/election-verify](https://github.com/abdullahrizwan7/election-verify) ·
**Set up for:** elections in India (Election Commission of India, PIB, IFCN fact-checkers, English and Hindi news)

---

## Run it (no accounts needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any keys the app runs in **demo mode**: sample data is kept in memory,
you sign in by picking a role, and the checks use free built-in methods instead of AI.

| Demo account | Can do |
|---|---|
| Citizen | Submit links, text and images. Follow their progress. Up to 10 per hour. |
| Reviewer | Everything above, plus the review queue, publishing verdicts and re-running checks. |
| Admin | Everything above, plus trusted sources, the activity log and the setup page. |

**Suggested demo for class**

1. Sign in as **Citizen** and submit a message or a news link. Watch the steps tick off live.
2. Sign in as **Reviewer**. Open your item, or *"Photo claims marked ballot papers…"* from the sample data.
3. Show the AI suggestion. Click a citation like `ev-5c` to jump to its evidence.
4. Pick a verdict, write the public explanation, and publish.
5. Open the public result page. Then, as **Admin**, show the activity log and the Setup page.

---

## How the checking pipeline works

Each submission goes through these steps in the background. The result page shows them live.

| Step | What it does | Free tool | Without a key |
|---|---|---|---|
| Read the content | Opens the link safely and extracts the article | `@mozilla/readability` + `jsdom` | Works |
| Check the source | Trusted-sources list, domain age, HTTPS | RDAP (public WHOIS replacement) | Works |
| Analyze the image | Camera metadata and text inside the image | `exifr` + `tesseract.js` | Works |
| | Describes the image and spots oddities | Gemini API | Skipped |
| Find the claims | Splits the content into checkable statements | Gemini API | Built-in rules |
| Search fact-checks | Finds fact-checks already published elsewhere | Google Fact Check Tools API | Skipped |
| Gather evidence | Finds news and official pages about each claim | Tavily search (+ Gemini for stance) | Skipped |
| Prepare for review | Suggests a verdict with cited evidence | Gemini API | Built-in rules |

Reviewers also get one-click **reverse image search** buttons (Google Lens, TinEye) to find older copies of
a photo, and can **add evidence they found themselves** (for example a call to the election office).

**Duplicates:** the exact same content sent again is counted as an extra report ("Reported 14×") instead of
being checked twice, and the review queue can sort by most reported. Images also get a **perceptual
fingerprint** (`lib/pipeline/image-hash.ts`), so a photo that was resized or re-compressed by WhatsApp is
recognised, and reviewers see the earlier submission and its verdict.

**For the public:** search and filter verified claims, a "My submissions" page, share buttons
(WhatsApp, copy link), and link previews with the verdict drawn on the image.

**Where it runs:** with Inngest connected, every step is a background job with retries. Without it, the
steps run right after the page responds (Next.js `after()`), which is fine for development and demos.

### Safety measures worth explaining

1. **Human in the loop.** The AI's verdict (`aiVerdict`) is stored apart from the reviewer's
   (`finalVerdict`), and only the reviewer's is ever shown to the public.
2. **Checked citations.** The AI summary cites evidence by ID. The review screen links each citation and
   highlights in red any ID that doesn't exist, so invented sources stand out.
3. **Prompt injection.** Submitted text is wrapped in `<content>` tags, and the AI is told never to follow
   instructions inside it.
4. **SSRF protection.** Before fetching a submitted link, and after every redirect, the server checks that
   the address is on the public internet. That stops links like `http://169.254.169.254` from reaching
   private systems. It also limits time (10 s), size (3 MB) and redirects (3). See `lib/pipeline/safe-fetch.ts`.
5. **Privacy.** GPS locations found in photos are never shown, only the fact that one exists. Images are
   stored in a private bucket with links that expire.
6. **Abuse limits.** Sign-in is required to submit, citizens can send 10 items per hour, and duplicates are
   detected with a SHA-256 fingerprint.
7. **Server-side checks.** Every form is validated again on the server (zod), and every page and action
   checks the role with `requireRole()`.
8. **Audit log.** Submissions, verdicts, re-runs and source changes are recorded with who did them.

---

## Design

A dark "mission control" look by default, with a light theme one click away (sun/moon button).

- **3D hero:** a turning WebGL globe ([`cobe`](https://github.com/shuding/cobe), about 5 KB) with a result card
  and evidence chips floating at different depths. The scene leans towards the mouse (`components/home/hero-scene.tsx`).
- **3D tilt cards** with a light that follows the pointer (`components/fx/tilt-card.tsx`).
- **Glass panels**, gradient headings, glowing accents, an aurora background and a faint grid (`app/globals.css`).
- **Motion:** sections fade in on scroll, numbers count up, the running pipeline step has a scanning light.
- **Respectful:** every animation stops for people who turn off motion in their device settings, the globe
  pauses when it's off screen, and touch screens get still cards.

### Presentation features

- **Presenter mode:** click “Watch the guided demo” on the home page (or Ctrl/⌘ + K → Start presenter mode).
  A 12-step tour walks through the citizen, reviewer, public and admin views, switching demo accounts
  and spotlighting each feature. Use → / ← to move and Esc to exit.
- **Analytics dashboard** (`/review/analytics`): claims per day, verdicts, median review time, and an
  AI-vs-reviewer agreement grid. Demo mode adds clearly labelled sample history.
- **Animated pipeline map**, interactive **evidence board** (React Flow), and **image forensics**
  (word boxes on the image, metadata readout, comparison slider).
- **Command palette** (Ctrl/⌘ + K) and **keyboard shortcuts** (press ? to see them).
- **Hindi and Urdu**: the language button in the header translates the public pages.
- **Installable app** (add to home screen), offline page, downloadable verdict images.

### Workflow PDF

`docs/ElectionVerify-Workflow.pdf` is a 13-page, slide-style overview of how the project works and how
each user uses it, with real screenshots. To rebuild it after changes, start the app and run
`npm run docs:pdf` (it uses Playwright to take the screenshots).

---

## Tech stack (all free)

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Cache Components, `proxy.ts`) + TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (Radix), lucide icons |
| Database | PostgreSQL + Prisma 7 (Supabase free tier, or local Postgres) |
| Login and storage | Supabase Auth (email link + Google) and Supabase Storage |
| Background jobs | Inngest (free plan) |
| AI | Google Gemini API (free tier), behind a small swappable module in `lib/ai/` |
| Evidence | Google Fact Check Tools API, Tavily, RDAP, Readability, exifr, tesseract.js |
| Tests | Vitest (unit), Playwright (end-to-end) |
| Hosting | Vercel (Hobby plan) |

---

## Folder structure

```
app/                          Pages (each folder = a URL)
├─ (public)/                  Pages anyone can see (the brackets don't appear in the URL)
│  ├─ page.tsx                /            Home
│  ├─ submit/                 /submit      Form + Server Action (validate, limit, save, start checks)
│  ├─ s/[id]/                 /s/:id       Live progress, then the published verdict and evidence
│  └─ verified/               /verified    All published verdicts, filter by rating
├─ (auth)/                    Sign-in page and sign-in/out Server Actions
├─ auth/callback/route.ts     Where Supabase sends people back after signing in
├─ api/inngest/route.ts       Endpoint Inngest calls to run pipeline steps
├─ review/                    Review queue and workspace (Reviewer role)
├─ admin/                     Trusted sources, activity log, setup (Admin role)
├─ error.tsx, not-found.tsx   Friendly error pages
└─ layout.tsx                 Header, footer and demo banner

components/                   UI, grouped by feature (ui/ holds the shadcn building blocks)

lib/
├─ pipeline/                  The verification pipeline
│  ├─ steps.ts                The list of steps, in order. Start reading here.
│  ├─ run.ts                  Runs the steps and records progress
│  ├─ safe-fetch.ts           SSRF-safe link fetching
│  ├─ extract-article.ts      Article text from a web page
│  ├─ source-reputation.ts    Trusted-source match and domain age
│  ├─ analyze-image.ts        Metadata and OCR
│  ├─ search-factchecks.ts    Google Fact Check Tools
│  ├─ find-web-evidence.ts    Tavily web search
│  └─ rules.ts                Non-AI fallbacks (claims, stances, verdict)
├─ ai/                        Gemini client and the four AI tasks
├─ data/                      Data layer: one interface, a demo (in-memory) and a Prisma version
├─ auth.ts                    getCurrentUser(), requireRole()
├─ validators.ts              zod rules for every form
└─ config.ts                  Reads environment variables, decides what is switched on

inngest/                      Background job definition
prisma/                       Schema, migrations and sample data seed
tests/unit/, tests/e2e/       Vitest and Playwright tests
proxy.ts                      Runs before each request (Next.js 16's new name for middleware)
```

---

## Connect the real services (all free)

Copy `.env.example` to `.env` (already done once) and fill in what you have. Restart `npm run dev` after
changing it. **Admin → Setup** in the app shows what is connected, and **`npm run check:services`** tests
every key with one tiny real request and says exactly what is wrong if one fails.

1. **Supabase** (database, login, image storage): create a project at [supabase.com](https://supabase.com).
   - `DATABASE_URL`: click **Connect** and copy the **Session pooler** string (it works on every network).
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`: Project Settings → API Keys.
   - Run `npm run setup:supabase` to create the private `submissions` bucket for images.
   - Authentication → URL Configuration → add `http://localhost:3000/auth/callback`.
   - Then run `npm run db:migrate` and `npm run db:seed`.
2. **Gemini**: `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey). When Google's
   main model is busy, the app automatically uses `gemini-flash-lite-latest` instead.
3. **Fact checks**: `GOOGLE_FACT_CHECK_API_KEY`. In Google Cloud, enable *Fact Check Tools API*, then create an API key.
4. **Web search**: `TAVILY_API_KEY` from [tavily.com](https://app.tavily.com). Trusted sites are searched
   first; the open web only when they have fewer than 2 results. `SEARCH_COUNTRY` (default `india`) ranks
   local results higher.
5. **Admins**: `ADMIN_EMAILS` with your email.
6. **Inngest** (optional locally): run `npx inngest-cli@latest dev` in a second terminal and set `INNGEST_DEV=1`.

Free Supabase projects pause after a week without use. Open the dashboard before your presentation.

### Trusted sources (India)

[`lib/data/sources-india.ts`](lib/data/sources-india.ts) lists 33 real sources with a starting trust score:

| Type | Sources |
|---|---|
| Official | Election Commission of India (eci.gov.in, incl. results and voter portals), PIB, india.gov.in, MyGov |
| Fact-checkers (IFCN) | Alt News, BOOM, FACTLY, Newschecker, Vishvas News, Fact Crescendo, AFP Fact Check |
| News | PTI, The Hindu, Indian Express, Hindustan Times, Mint, NDTV, Times of India, India Today, The Quint, Deccan Herald, The Wire, Scroll, Reuters, BBC, DD News, All India Radio |
| Hindi news | Dainik Bhaskar, Amar Ujala, Dainik Jagran, Aaj Tak |
| Satire | The Fauxy, Faking News (both say so on their own sites) |

`npm run db:sources` puts the list in the database without touching submissions. Admins can change trust
scores and add sites (for example state election offices, or sites with a record of false stories) at
**Admin → Sources**. The made-up `.example` sources are only used by the sample stories in demo mode.

---

## Deploy to Vercel (free)

1. Push the code to GitHub.
2. In Vercel, import the repository. The default settings work.
3. Add the same environment variables in Project Settings → Environment Variables, plus
   `NEXT_PUBLIC_SITE_URL` with your Vercel address. For `DATABASE_URL` use Supabase's **Transaction pooler**
   (same address, port `6543`), which suits serverless hosting. Inngest keys are optional.
4. In Supabase, add `https://<your-app>.vercel.app/auth/callback` as a redirect URL.
5. In Inngest, sync the app at `https://<your-app>.vercel.app/api/inngest` (optional).
6. Deploying from your own computer instead: `npx vercel@latest deploy --prod`. `.vercelignore` keeps
   `.env` and `private/` from ever being uploaded.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / run it |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright). First run `npx playwright install chromium` |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:migrate` / `db:seed` / `db:studio` | Database schema, sample data, database browser |
| `npm run db:sources` | Put the Indian trusted-sources list in the database |
| `npm run check:services` | Test every API key in `.env` |
| `npm run setup:supabase` | Create the private image bucket in Supabase |

GitHub runs lint, types, unit tests, the build and the browser tests on every push
(`.github/workflows/ci.yml`).

---

## Project status

| Day | Work | Status |
|---|---|---|
| 1 | Setup, schema, login and roles, all pages | ✅ Done |
| 2 | Submissions, image upload, hourly limit, duplicate check | ✅ Done |
| 3 | Pipeline: safe link reading, article extraction, source reputation, claims | ✅ Done |
| 4 | Fact-check search, web evidence, AI suggestion with citations | ✅ Done (needs free keys) |
| 5 | Image metadata, OCR, AI image notes, reverse image search links | ✅ Done |
| 6 | Re-run, reviewer evidence, duplicate reports, queue sorting, activity log, setup page | ✅ Done |
| 7 | Tests (72 unit, 8 browser), CI, sitemap, security headers, method page, key checker | ✅ Done |
| + | Real services connected: Supabase, Gemini, Google Fact Check, Tavily; Indian trusted sources; code on GitHub | ✅ Done |
| + | Google sign-in; live on Vercel at election-verify.vercel.app | ✅ Done |
