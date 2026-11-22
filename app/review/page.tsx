import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react";
import { CountUp } from "@/components/fx/count-up";
import { TiltCard } from "@/components/fx/tilt-card";
import { QueueKeys } from "@/components/review/queue-keys";
import { ReviewQueueTable } from "@/components/review/review-queue-table";
import { TableSkeleton } from "@/components/skeletons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          <span className="text-gradient">Review queue</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Check the evidence the system collected, then publish a verdict. Nothing is public until you do.
        </p>
        <Link href="/review/analytics" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <BarChart3 className="size-4" aria-hidden /> Open analytics
        </Link>
      </div>
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
    { label: "Needs review", value: stats.needsReview, icon: ClipboardCheck, className: "bg-tint-olive text-tint-olive-foreground" },
    { label: "Being analyzed", value: stats.processing, icon: Loader2, className: "bg-tint-steel text-tint-steel-foreground" },
    { label: "Published", value: stats.published, icon: CheckCircle2, className: "bg-tint-ink text-tint-ink-foreground" },
    { label: "Failed", value: stats.failed, icon: AlertTriangle, className: "bg-tint-rust text-tint-rust-foreground" },
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, className }) => (
          <TiltCard key={label} max={5}>
            <div className={cn("flex h-full flex-col justify-between rounded-2xl p-5", className)}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium opacity-80">{label}</p>
                <Icon className="size-4 opacity-70" aria-hidden />
              </div>
              <p className="mt-6 text-4xl font-bold tracking-tight">
                <CountUp value={value} />
              </p>
            </div>
          </TiltCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
          {FILTERS.map((filter) => {
            const active = filter.status === status;
            return (
              <Link
                key={filter.label}
                href={queueHref(filter.status, sort)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition",
                  active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
        <nav className="flex items-center gap-1 text-sm" aria-label="Sort">
          <span className="mr-1 text-muted-foreground">Sort:</span>
          {SORTS.map((option) => (
            <Link
              key={option.value}
              href={queueHref(status, option.value)}
              aria-current={option.value === sort ? "true" : undefined}
              className={cn(
                "rounded-md px-2 py-1 transition",
                option.value === sort ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground",
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
