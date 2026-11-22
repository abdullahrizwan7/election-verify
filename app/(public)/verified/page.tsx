import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BadgeCheck, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CardGridSkeleton } from "@/components/skeletons";
import { SubmissionCard } from "@/components/submission-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublished } from "@/lib/data";
import { VERDICT_ORDER, VERDICTS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/types";

export const metadata: Metadata = { title: "Verified claims" };

type SearchParams = Promise<{ verdict?: string; q?: string }>;

export default function VerifiedPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="page-enter mx-auto max-w-7xl space-y-10 px-4 pt-10 pb-16 sm:px-6 md:pt-16">
      <PageHeader
        eyebrow="Library"
        icon={BadgeCheck}
        title="Verified"
        muted="claims."
        description="Election claims our reviewers have checked, newest first. Search, filter by rating and share."
      />
      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <FilteredResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function hrefFor(verdict: Verdict | undefined, query: string) {
  const params = new URLSearchParams();
  if (verdict) params.set("verdict", verdict);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/verified?${qs}` : "/verified";
}

async function FilteredResults({ searchParams }: { searchParams: SearchParams }) {
  const { verdict: raw, q = "" } = await searchParams;
  const verdict = VERDICT_ORDER.includes(raw as Verdict) ? (raw as Verdict) : undefined;
  const query = q.trim().slice(0, 100);
  const items = await listPublished({ verdict, query });

  return (
    <div className="space-y-8">
      {/* A plain GET form: the search is part of the URL, so results can be shared. */}
      <div className="glass flex flex-col gap-3 rounded-[2rem] bg-card p-2 ring-1 ring-foreground/[0.07] lg:flex-row lg:items-center">
      <form action="/verified" className="flex flex-1 gap-2" role="search">
        {verdict && <input type="hidden" name="verdict" value={verdict} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={query} placeholder="Search, e.g. polling hours, voter ID, ballots" className="h-12 rounded-full pl-11" aria-label="Search verified claims" />
        </div>
        <Button type="submit" className="h-12 rounded-full px-6">
          Search
        </Button>
      </form>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0" aria-label="Filter by rating">
        <FilterChip href={hrefFor(undefined, query)} active={!verdict} label="All" />
        {VERDICT_ORDER.map((v) => (
          <FilterChip key={v} href={hrefFor(v, query)} active={verdict === v} label={VERDICTS[v].label} dot={VERDICTS[v].dotClassName} />
        ))}
      </nav>
      </div>

      {items.length === 0 ? (
        <p className="glass rounded-[2rem] border border-dashed border-foreground/15 bg-card/50 p-14 text-center text-muted-foreground">
          {query ? `No published claims match “${query}”.` : "No published claims with this rating yet."}{" "}
          <Link href="/submit" className="text-primary hover:underline">
            Send it to us to check.
          </Link>
        </p>
      ) : (
        <>
          {query && (
            <p className="text-sm text-muted-foreground">
              {items.length} result{items.length === 1 ? "" : "s"} for “{query}”
            </p>
          )}
          <div className="stagger grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {items.map((item) => (
              <SubmissionCard key={item.id} submission={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ href, active, label, dot }: { href: string; active: boolean; label: string; dot?: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-300",
        active ? "bg-foreground text-background shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)]" : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
      )}
    >
      {dot && <span className={cn("size-2 rounded-full", dot)} aria-hidden />}
      {label}
    </Link>
  );
}
