import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
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
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Verified claims</h1>
        <p className="mt-1 text-muted-foreground">Election claims our reviewers have checked, newest first.</p>
      </div>
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
    <div className="space-y-6">
      {/* A plain GET form: the search is part of the URL, so results can be shared. */}
      <form action="/verified" className="flex max-w-xl gap-2" role="search">
        {verdict && <input type="hidden" name="verdict" value={verdict} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={query} placeholder="Search, e.g. polling hours, voter ID, ballots" className="pl-8" aria-label="Search verified claims" />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by rating">
        <FilterChip href={hrefFor(undefined, query)} active={!verdict} label="All" />
        {VERDICT_ORDER.map((v) => (
          <FilterChip key={v} href={hrefFor(v, query)} active={verdict === v} label={VERDICTS[v].label} dot={VERDICTS[v].dotClassName} />
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />}
      {label}
    </Link>
  );
}
