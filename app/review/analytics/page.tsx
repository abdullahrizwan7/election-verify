import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BarChart3, BrainCircuit, CheckCircle2, Clock, Inbox, Info } from "lucide-react";
import { ActivityChart } from "@/components/analytics/activity-chart";
import { AgreementMatrix } from "@/components/analytics/agreement-matrix";
import { VerdictBars } from "@/components/analytics/verdict-bars";
import { CountUp } from "@/components/fx/count-up";
import { InputTypeIcon } from "@/components/input-type-icon";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge } from "@/components/verdict-badge";
import { requireRole } from "@/lib/auth";
import { getAnalytics } from "@/lib/data";
import { INPUT_TYPES } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [7, 30, 60];
const TILE_TONES = [
  "bg-tint-lime text-tint-lime-foreground",
  "bg-tint-coral text-tint-coral-foreground",
  "bg-tint-sky text-tint-sky-foreground",
  "bg-tint-ink text-tint-ink-foreground",
];
type SearchParams = Promise<{ range?: string }>;

export default function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="page-enter mx-auto max-w-7xl space-y-8 px-4 pt-8 pb-16 sm:px-6 md:pt-12">
      <PageHeader
        eyebrow="Insights"
        icon={BarChart3}
        title="Review"
        muted="analytics."
        description="How many claims arrive, what we find, and how often reviewers agree with the AI."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("REVIEWER", "/review/analytics");
  const { range: raw } = await searchParams;
  const range = RANGES.includes(Number(raw)) ? Number(raw) : 30;
  const data = await getAnalytics(range);

  const agreementPct = data.agreement.reviewed ? Math.round((data.agreement.agreed / data.agreement.reviewed) * 100) : 0;
  const typeTotal = data.byType.reduce((sum, t) => sum + t.count, 0) || 1;

  const tiles = [
    { label: "Claims submitted", value: data.totals.submitted, suffix: "", icon: Inbox },
    { label: "Verdicts published", value: data.totals.published, suffix: "", icon: CheckCircle2 },
    { label: "Reviewers agreed with the AI", value: agreementPct, suffix: "%", icon: BrainCircuit },
    { label: "Median time to a verdict", value: data.medianReviewHours ?? 0, suffix: " h", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="glass flex gap-1 rounded-full bg-card p-1 text-sm ring-1 ring-foreground/[0.07]" aria-label="Time range">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/review/analytics?range=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={cn("rounded-full px-4 py-2 font-semibold transition-colors", r === range ? "bg-foreground text-background shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)]" : "text-muted-foreground hover:text-foreground")}
            >
              Last {r} days
            </Link>
          ))}
        </nav>
        {data.isSample && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" aria-hidden /> Demo mode: includes generated sample history
          </p>
        )}
      </div>

      <dl className="stagger grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {tiles.map(({ label, value, suffix, icon: Icon }, i) => (
          <div key={label} className={cn("flex h-36 flex-col justify-between rounded-[1.75rem] p-5 md:h-40 md:p-6", TILE_TONES[i])}>
            <div className="flex items-start justify-between gap-2">
              <dt className="text-sm font-semibold opacity-80">{label}</dt>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-current/10">
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
            <dd className="text-5xl leading-none font-bold tracking-tight">
              <CountUp value={value} />
              {suffix}
            </dd>
          </div>
        ))}
      </dl>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Claims per day</CardTitle>
          <CardDescription>Items people sent us, and verdicts our reviewers published.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityChart data={data.daily} />
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show the numbers as a table</summary>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-popover">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2 text-right">Submitted</th>
                    <th className="p-2 text-right">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((d) => (
                    <tr key={d.date} className="border-t">
                      <td className="p-2">{d.date}</td>
                      <td className="p-2 text-right tabular-nums">{d.submitted}</td>
                      <td className="p-2 text-right tabular-nums">{d.published}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Published verdicts</CardTitle>
            <CardDescription>What our reviewers concluded.</CardDescription>
          </CardHeader>
          <CardContent>
            <VerdictBars data={data.verdicts} />
          </CardContent>
        </Card>
        <Card data-tour="analytics">
          <CardHeader>
            <CardTitle className="text-base">AI suggestion vs. reviewer decision</CardTitle>
            <CardDescription>
              Reviewers agreed with the AI on {data.agreement.agreed} of {data.agreement.reviewed} items. The rest show why a
              human check matters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgreementMatrix matrix={data.matrix} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What people send</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.byType.map((t) => {
              const pct = Math.round((t.count / typeTotal) * 100);
              return (
                <div key={t.type} className="flex items-center gap-3">
                  <InputTypeIcon type={t.type} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{INPUT_TYPES[t.type]}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {t.count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-glow to-glow-2" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most reported claims</CardTitle>
            <CardDescription>The rumours people sent us most often.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {data.topReported.map((item, index) => (
                <li key={item.id}>
                  <Link href={`/review/${item.id}`} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm transition hover:border-glow/40 hover:bg-muted/40">
                    <span className="w-5 text-center font-mono text-muted-foreground">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    <span className="shrink-0 text-xs font-medium text-amber-600 dark:text-amber-300">{item.reportCount}×</span>
                    {item.finalVerdict ? <VerdictBadge verdict={item.finalVerdict} /> : <StatusBadge status={item.status} />}
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
