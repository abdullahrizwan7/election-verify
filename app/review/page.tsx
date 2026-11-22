import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react";
import { CountUp } from "@/components/fx/count-up";
import { QueueKeys } from "@/components/review/queue-keys";
import { ReviewQueueTable } from "@/components/review/review-queue-table";
import { TableSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getStats, listForReview } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { ReviewSort, Status } from "@/lib/types";

export const metadata: Metadata = { title: "Review queue" };

const FILTERS: { label: string; status?: Status }[] = [
  { label: "All open" },
  { label: "Needs review", status: "NEEDS_REVIEW" },
  { label: "Analyzing", status: "PROCESSING" },
  { label: "Queued", status: "QUEUED" },
  { label: "Failed", status: "FAILED" },
  { label: "Published", status: "PUBLISHED" },
];

const SORTS: { label: string; value: ReviewSort }[] = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Most reported", value: "reports" },
];

type SearchParams = Promise<{ status?: string; sort?: string; notice?: string }>;

/** Builds a queue link that keeps the other filter. */
function queueHref(status: Status | undefined, sort: ReviewSort) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (sort !== "newest") params.set("sort", sort);
  const query = params.toString();
  return query ? `/review?${query}` : "/review";
}

export default function ReviewPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="page-enter mx-auto max-w-7xl space-y-8 px-4 pt-8 pb-16 sm:px-6 md:pt-12">
      <PageHeader
        eyebrow="Reviewer workspace"
        icon={ClipboardCheck}
        title="Review"
        muted="queue."
        description="Check the evidence the system collected, then publish a verdict. Nothing is public until you do."
        actions={
          <Button variant="outline" asChild className="h-11 rounded-full px-5">
            <Link href="/review/analytics">
              <BarChart3 aria-hidden /> Analytics
            </Link>
          </Button>
        }
      />
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <TableSkeleton />
          </div>
        }
      >
        <ReviewDashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ReviewDashboard({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("REVIEWER", "/review");
  const { status: raw, sort: rawSort, notice } = await searchParams;
  const status = FILTERS.find((f) => f.status === raw)?.status;
  const sort = SORTS.find((s) => s.value === rawSort)?.value ?? "newest";
  const [stats, items] = await Promise.all([getStats(), listForReview({ status, sort })]);

  // Tinted stat tiles (same style as the home page dashboard preview).
  const cards = [
    { label: "Needs review", value: stats.needsReview, icon: ClipboardCheck, className: "bg-tint-lime text-tint-lime-foreground" },
    { label: "Being analyzed", value: stats.processing, icon: Loader2, className: "bg-tint-sky text-tint-sky-foreground" },
    { label: "Published", value: stats.published, icon: CheckCircle2, className: "bg-tint-ink text-tint-ink-foreground" },
    { label: "Failed", value: stats.failed, icon: AlertTriangle, className: "bg-tint-coral text-tint-coral-foreground" },
  ];

  return (
    <div className="space-y-6">
      {notice === "published" && (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertTitle>Verdict published</AlertTitle>
          <AlertDescription>It is now visible on the public results page.</AlertDescription>
        </Alert>
      )}

      <div className="stagger grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, className }) => (
          <div key={label} className={cn("flex h-36 flex-col justify-between rounded-[1.75rem] p-5 transition-transform duration-500 ease-(--ease-pop) hover:-translate-y-1 md:h-40 md:p-6", className)}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold opacity-80">{label}</p>
              <span className="flex size-9 items-center justify-center rounded-full bg-current/10">
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
            <p className="text-5xl leading-none font-bold tracking-tight">
              <CountUp value={value} />
            </p>
          </div>
        ))}
      </div>

      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-card p-2 ring-1 ring-foreground/[0.07]">
        <nav className="no-scrollbar flex gap-1 overflow-x-auto" aria-label="Filter by status">
          {FILTERS.map((filter) => {
            const active = filter.status === status;
            return (
              <Link
                key={filter.label}
                href={queueHref(filter.status, sort)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-300",
                  active ? "bg-foreground text-background shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)]" : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
        <nav className="flex items-center gap-1 rounded-full bg-foreground/[0.05] p-1 text-sm" aria-label="Sort">
          <span className="mr-1 pl-3 text-xs font-semibold text-muted-foreground">Sort</span>
          {SORTS.map((option) => (
            <Link
              key={option.value}
              href={queueHref(status, option.value)}
              aria-current={option.value === sort ? "true" : undefined}
              className={cn(
                "rounded-full px-3 py-1.5 font-semibold transition-colors",
                option.value === sort ? "bg-background shadow-sm dark:bg-white/15" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </div>

      <ReviewQueueTable items={items} />
      <QueueKeys />
      <p className="text-xs text-muted-foreground">
        Tip: press <kbd className="rounded border bg-muted px-1 font-mono">J</kbd> /{" "}
        <kbd className="rounded border bg-muted px-1 font-mono">K</kbd> to move through the queue and{" "}
        <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> to open. Press{" "}
        <kbd className="rounded border bg-muted px-1 font-mono">?</kbd> for all shortcuts.
      </p>
    </div>
  );
}
