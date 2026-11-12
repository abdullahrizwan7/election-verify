import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react";
import { ReviewQueueTable } from "@/components/review/review-queue-table";
import { TableSkeleton } from "@/components/skeletons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getStats, listForReview } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/types";

export const metadata: Metadata = { title: "Review queue" };

const FILTERS: { label: string; status?: Status }[] = [
  { label: "All open" },
  { label: "Needs review", status: "NEEDS_REVIEW" },
  { label: "Analyzing", status: "PROCESSING" },
  { label: "Queued", status: "QUEUED" },
  { label: "Failed", status: "FAILED" },
  { label: "Published", status: "PUBLISHED" },
];

type SearchParams = Promise<{ status?: string; notice?: string }>;

export default function ReviewPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Review queue</h1>
        <p className="mt-1 text-muted-foreground">
          Check the evidence the system collected, then publish a verdict. Nothing is public until you do.
        </p>
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
  const { status: raw, notice } = await searchParams;
  const status = FILTERS.find((f) => f.status === raw)?.status;
  const [stats, items] = await Promise.all([getStats(), listForReview({ status })]);

  const cards = [
    { label: "Needs review", value: stats.needsReview, icon: ClipboardCheck, className: "text-amber-600" },
    { label: "Being analyzed", value: stats.processing, icon: Loader2, className: "text-sky-600" },
    { label: "Published", value: stats.published, icon: CheckCircle2, className: "text-emerald-600" },
    { label: "Failed", value: stats.failed, icon: AlertTriangle, className: "text-red-600" },
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
          <Card key={label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-semibold tabular-nums">{value}</p>
              </div>
              <Icon className={cn("size-6", className)} aria-hidden />
            </CardContent>
          </Card>
        ))}
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {FILTERS.map((filter) => {
          const active = filter.status === status;
          return (
            <Link
              key={filter.label}
              href={filter.status ? `/review?status=${filter.status}` : "/review"}
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

      <ReviewQueueTable items={items} />
    </div>
  );
}
