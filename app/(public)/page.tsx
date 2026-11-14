import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { CountUp } from "@/components/fx/count-up";
import { Reveal } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";
import { HeroScene } from "@/components/home/hero-scene";
import { T } from "@/components/i18n";
import { StartTourButton } from "@/components/presenter/presenter";
import { HowItWorks } from "@/components/home/how-it-works";
import { RatingsLegend } from "@/components/home/ratings-legend";
import { VerdictTicker } from "@/components/home/verdict-ticker";
import { CardGridSkeleton } from "@/components/skeletons";
import { SubmissionCard } from "@/components/submission-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats, listPublished } from "@/lib/data";

const TOOLS = ["Readability", "Google Fact Check", "Gemini AI", "Tesseract OCR", "RDAP domain age", "Perceptual image hash"];

export default function HomePage() {
  return (
    <main>
      {/* Hero: static, so it loads instantly. The numbers stream in. */}
      <section className="relative overflow-hidden" data-tour="hero">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 md:grid-cols-[1.05fr_1fr] md:pt-20 md:pb-24">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-glow/30 bg-card px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="size-1.5 animate-pulse-ring rounded-full bg-glow" />
              <T k="hero.badge" />
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              <T k="hero.title1" />{" "}
              <span className="text-gradient">
                <T k="hero.title2" />
              </span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground text-pretty">
              <T k="hero.body" />
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild className="glow relative h-11 overflow-hidden px-5 text-base">
                <Link href="/submit">
                  <span className="absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/35 blur-md" aria-hidden />
                  <T k="nav.submit" /> <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 bg-card px-5 text-base backdrop-blur">
                <Link href="/verified">
                  <T k="hero.browse" />
                </Link>
              </Button>
            </div>
            <Suspense fallback={<StatsSkeleton />}>
              <StatTiles />
            </Suspense>
            <StartTourButton className="-ml-2 text-muted-foreground" />
          </div>
          <HeroScene />
        </div>
      </section>

      <Suspense fallback={<div className="h-12 border-y" />}>
        <VerdictTicker />
      </Suspense>

      {/* What powers the checks */}
      <section className="border-b bg-card/20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="size-4 text-glow" aria-hidden /> <T k="tools.title" />
          </span>
          {TOOLS.map((tool) => (
            <span key={tool} className="tracking-wide">
              {tool}
            </span>
          ))}
        </div>
      </section>

      <HowItWorks />

      {/* Recent results: read from the database on each request */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-widest text-glow uppercase">
              <T k="recent.eyebrow" />
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              <T k="recent.title" />
            </h2>
            <p className="mt-1 text-muted-foreground">
              <T k="recent.subtitle" />
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/verified">
              <T k="recent.all" /> <ArrowRight aria-hidden />
            </Link>
          </Button>
        </Reveal>
        <Suspense fallback={<CardGridSkeleton />}>
          <RecentlyVerified />
        </Suspense>
      </section>

      <RatingsLegend />

      {/* Closing call to action */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="border-gradient relative overflow-hidden rounded-3xl px-6 py-14 text-center">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-glow/25 blur-3xl" aria-hidden />
            <div className="relative space-y-5">
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                <T k="cta.title1" />{" "}
                <span className="text-gradient">
                  <T k="cta.title2" />
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground">
                <T k="cta.body" />
              </p>
              <Button size="lg" asChild className="glow h-11 px-6 text-base">
                <Link href="/submit">
                  <T k="cta.button" /> <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

async function StatTiles() {
  const stats = await getStats();
  const tiles = [
    { label: "stats.submitted" as const, value: stats.total },
    { label: "stats.published" as const, value: stats.published },
    { label: "stats.waiting" as const, value: stats.needsReview },
  ];
  return (
    <dl className="grid max-w-lg grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border bg-card p-3 backdrop-blur">
          <dd className="text-2xl font-semibold text-gradient">
            <CountUp value={tile.value} />
          </dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">
            <T k={tile.label} />
          </dt>
        </div>
      ))}
    </dl>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid max-w-lg grid-cols-3 gap-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[72px] rounded-xl" />
      ))}
    </div>
  );
}

async function RecentlyVerified() {
  const items = (await listPublished()).slice(0, 3);
  if (items.length === 0) {
    return <p className="text-muted-foreground">No verdicts published yet.</p>;
  }
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item, index) => (
        <Reveal key={item.id} delay={index * 120} className="h-full">
          <TiltCard>
            <SubmissionCard submission={item} />
          </TiltCard>
        </Reveal>
      ))}
    </div>
  );
}
