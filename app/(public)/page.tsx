import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { DashboardPreview, DashboardPreviewSkeleton } from "@/components/home/dashboard-preview";
import { Faq } from "@/components/home/faq";
import { FeatureBento } from "@/components/home/feature-bento";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { RatingsLegend } from "@/components/home/ratings-legend";
import { SourceStrip } from "@/components/home/source-strip";
import { TeamVoices } from "@/components/home/team-voices";
import { T } from "@/components/i18n";
import { InView, Magnetic, SplitReveal } from "@/components/motion/reveal";
import { CardGridSkeleton } from "@/components/skeletons";
import { SubmissionCard } from "@/components/submission-card";
import { Button } from "@/components/ui/button";
import { CtaButton } from "@/components/ui/cta-button";
import { listPublished } from "@/lib/data";

export default function HomePage() {
  return (
    <main className="page-enter">
      <Hero>
        {/* The workspace preview reads live numbers, so it streams in. */}
        <Suspense fallback={<DashboardPreviewSkeleton />}>
          <DashboardPreview />
        </Suspense>
      </Hero>

      <SourceStrip />

      <FeatureBento />

      <HowItWorks />

      {/* Recent results: read from the database on each request */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <InView className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">
              <T k="recent.eyebrow" />
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              <T k="recent.title" />
            </h2>
            <p className="mt-2 text-muted-foreground">
              <T k="recent.subtitle" />
            </p>
          </div>
          <Button variant="outline" asChild className="h-11 rounded-full px-5">
            <Link href="/verified">
              <T k="recent.all" /> <ArrowRight aria-hidden />
            </Link>
          </Button>
        </InView>
        <Suspense fallback={<CardGridSkeleton />}>
          <RecentlyVerified />
        </Suspense>
      </section>

      <TeamVoices />

      <RatingsLegend />

      <Faq />

      {/* Closing call to action: a dark card with slow glowing orbs */}
      <section className="px-3 py-16 sm:px-4 md:py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-tint-ink px-6 py-16 text-center text-tint-ink-foreground md:rounded-[3rem] md:p-24">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="orb absolute -top-24 -left-20 size-80 rounded-full bg-brand/40 blur-[100px]" />
            <div className="orb absolute -right-16 -bottom-24 size-96 rounded-full bg-ai/40 blur-[110px] [animation-delay:-8s]" />
          </div>
          <div className="relative space-y-8">
            <h2 className="text-4xl leading-[1.02] font-bold tracking-tight text-balance md:text-7xl">
              <SplitReveal inView text="Got a message that seems" />
              <br />
              <SplitReveal inView text="too shocking to be true?" delay={0.12} className="text-white/45" />
            </h2>
            <p className="mx-auto max-w-xl text-lg text-white/65 md:text-xl">
              <T k="cta.body" />
            </p>
            <Magnetic>
              <CtaButton href="/submit">
                <T k="cta.button" />
              </CtaButton>
            </Magnetic>
          </div>
        </div>
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
    <div className="stagger grid gap-4 md:grid-cols-3 md:gap-5">
      {items.map((item) => (
        <SubmissionCard key={item.id} submission={item} />
      ))}
    </div>
  );
}
