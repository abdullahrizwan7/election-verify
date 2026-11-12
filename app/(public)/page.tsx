import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { HeroPreview } from "@/components/home/hero-preview";
import { HowItWorks } from "@/components/home/how-it-works";
import { RatingsLegend } from "@/components/home/ratings-legend";
import { CardGridSkeleton } from "@/components/skeletons";
import { SubmissionCard } from "@/components/submission-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats, listPublished } from "@/lib/data";

export default function HomePage() {
  return (
    <main>
      {/* Hero: static, so it loads instantly */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              AI-assisted · Human-reviewed
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Check election news before you share it.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground text-pretty">
              Send us a link, a forwarded message or a photo. We gather the evidence, and a trained reviewer
              publishes a clear verdict you can trust.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild className="h-10 px-4">
                <Link href="/submit">
                  Submit a claim <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-10 px-4">
                <Link href="/verified">Browse verified claims</Link>
              </Button>
            </div>
            <Suspense fallback={<Skeleton className="h-5 w-72" />}>
              <StatsLine />
            </Suspense>
          </div>
          <HeroPreview />
        </div>
      </section>

      <HowItWorks />

      {/* Recent results: read from the database on each request */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Recently verified</h2>
            <p className="text-muted-foreground">Every verdict below was checked by a human reviewer.</p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/verified">
              See all <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <Suspense fallback={<CardGridSkeleton />}>
          <RecentlyVerified />
        </Suspense>
      </section>

      <RatingsLegend />
    </main>
  );
}

async function StatsLine() {
  const stats = await getStats();
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{stats.total}</span> claims submitted ·{" "}
      <span className="font-semibold text-foreground">{stats.published}</span> verdicts published ·{" "}
      <span className="font-semibold text-foreground">{stats.needsReview}</span> waiting for a reviewer
    </p>
  );
}

async function RecentlyVerified() {
  const items = (await listPublished()).slice(0, 3);
  if (items.length === 0) {
    return <p className="text-muted-foreground">No verdicts published yet.</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <SubmissionCard key={item.id} submission={item} />
      ))}
    </div>
  );
}
