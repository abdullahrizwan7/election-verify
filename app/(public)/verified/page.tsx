import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CardGridSkeleton } from "@/components/skeletons";
import { SubmissionCard } from "@/components/submission-card";
import { listPublished } from "@/lib/data";
import { VERDICT_ORDER, VERDICTS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/types";

export const metadata: Metadata = { title: "Verified claims" };

type SearchParams = Promise<{ verdict?: string }>;

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

async function FilteredResults({ searchParams }: { searchParams: SearchParams }) {
  const { verdict: raw } = await searchParams;
  const verdict = VERDICT_ORDER.includes(raw as Verdict) ? (raw as Verdict) : undefined;
  const items = await listPublished({ verdict });

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2" aria-label="Filter by rating">
        <FilterChip href="/verified" active={!verdict} label="All" />
        {VERDICT_ORDER.map((v) => (
          <FilterChip key={v} href={`/verified?verdict=${v}`} active={verdict === v} label={VERDICTS[v].label} dot={VERDICTS[v].dotClassName} />
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No published claims with this rating yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SubmissionCard key={item.id} submission={item} />
          ))}
        </div>
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
