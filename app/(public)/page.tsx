import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";
import { DashboardPreview } from "@/components/home/dashboard-preview";
import { FeatureBento } from "@/components/home/feature-bento";
import { HowItWorks } from "@/components/home/how-it-works";
import { RatingsLegend } from "@/components/home/ratings-legend";
import { SourceStrip } from "@/components/home/source-strip";
import { VerdictTicker } from "@/components/home/verdict-ticker";
import { T } from "@/components/i18n";
import { StartTourButton } from "@/components/presenter/presenter";
import { CardGridSkeleton } from "@/components/skeletons";
import { SubmissionCard } from "@/components/submission-card";
import { Button } from "@/components/ui/button";
import { CtaButton } from "@/components/ui/cta-button";
import { listPublished } from "@/lib/data";

export default function HomePage() {
  return (
    <main>
      {/* Hero: centred, static and instant. The dashboard numbers stream in below. */}
      <section className="relative px-4 pt-16 pb-14 text-center md:pt-24" data-tour="hero">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-4xl space-y-7">
          <span className="word-in !inline-flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase backdrop-blur">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            <T k="hero.badge" />
          </span>
          <h1 className="text-5xl leading-[1.02] font-bold tracking-tight text-balance sm:text-7xl lg:text-[5.5rem]">
            <span className="word-in">
              <T k="hero.title1" />
            </span>
            <br />
            <span className="word-in text-gradient [animation-delay:140ms]">
              <T k="hero.title2" />
            </span>
          </h1>
          <p className="word-in mx-auto max-w-2xl text-lg text-muted-foreground text-pretty [animation-delay:260ms] sm:text-xl">
            <T k="hero.body" />
          </p>
          <div className="word-in flex flex-col items-center justify-center gap-3 [animation-delay:380ms] sm:flex-row">
            <CtaButton href="/submit">
              <T k="nav.submit" />
            </CtaButton>
            <CtaButton href="/verified" variant="ghost" arrow={false}>
              <T k="hero.browse" />
            </CtaButton>
          </div>
          <div className="word-in [animation-delay:500ms]">
            <StartTourButton className="text-muted-foreground" />
          </div>
        </div>
      </section>

      <DashboardPreview />

      <SourceStrip />

      <Suspense fallback={<div className="h-12 border-y" />}>
        <VerdictTicker />
      </Suspense>

      <FeatureBento />

      <HowItWorks />

      {/* Recent results: read from the database on each request */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">
              <T k="recent.eyebrow" />
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight">
              <T k="recent.title" />
            </h2>
            <p className="mt-1 text-muted-foreground">
              <T k="recent.subtitle" />
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden rounded-full sm:inline-flex">
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

      {/* Closing call to action: a dark card with slow glowing orbs */}
      <section className="px-3 py-20 sm:px-4 md:py-28">
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-tint-ink px-6 py-16 text-center text-tint-ink-foreground md:rounded-[3rem] md:py-24">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="orb absolute -top-24 -left-20 size-80 rounded-full bg-brand/40 blur-[100px]" />
              <div className="orb absolute -right-16 -bottom-24 size-96 rounded-full bg-glow-2/35 blur-[110px] [animation-delay:-8s]" />
            </div>
            <div className="relative space-y-7">
              <h2 className="text-4xl leading-[1.04] font-bold tracking-tight text-balance md:text-6xl">
                <T k="cta.title1" />
                <br />
                <span className="text-white/45">
                  <T k="cta.title2" />
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-lg text-white/65">
                <T k="cta.body" />
              </p>
              <CtaButton href="/submit">
                <T k="cta.button" />
              </CtaButton>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
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
