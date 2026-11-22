import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, Clock, FileSearch } from "lucide-react";
import { CountUp } from "@/components/fx/count-up";
import { T } from "@/components/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge } from "@/components/verdict-badge";
import { getStats, listPublished } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * A framed "live dashboard" under the hero (Cognify-style product preview):
 * tinted stat tiles that count up, and the latest real verdicts.
 */
export function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-5xl px-3 sm:px-4">
      <div className="pointer-events-none absolute -inset-x-10 -top-10 h-56 rounded-full bg-brand/15 blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[2rem] border bg-card/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {/* Browser bar */}
        <div className="flex items-center gap-2 border-b px-5 py-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="mx-auto rounded-full bg-muted px-4 py-1 text-xs text-muted-foreground">election-verify.vercel.app/review</span>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Live from the database</p>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Election claims, checked today</h3>
            </div>
            <div className="flex rounded-full border bg-muted/60 p-1 text-xs font-medium">
              {["Overview", "Queue", "Analytics"].map((tab, i) => (
                <span key={tab} className={cn("rounded-full px-3 py-1.5", i === 0 ? "bg-background shadow-sm" : "text-muted-foreground")}>
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <Suspense fallback={<TilesSkeleton />}>
            <Tiles />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
            <LatestRows />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

const TILE_STYLES = [
  "bg-tint-olive text-tint-olive-foreground",
  "bg-tint-rust text-tint-rust-foreground",
  "bg-tint-steel text-tint-steel-foreground",
];

async function Tiles() {
  const stats = await getStats();
  const tiles = [
    { label: "stats.submitted" as const, value: stats.total, icon: FileSearch },
    { label: "stats.published" as const, value: stats.published, icon: CheckCircle2 },
    { label: "stats.waiting" as const, value: stats.needsReview, icon: Clock },
  ];
  return (
    <dl className="grid grid-cols-3 gap-3 sm:gap-4">
      {tiles.map(({ label, value, icon: Icon }, i) => (
        <div key={label} className={cn("rounded-2xl p-4 sm:p-5", TILE_STYLES[i])}>
          <div className="flex items-start justify-between gap-2">
            <dt className="text-xs font-medium opacity-80 sm:text-sm">
              <T k={label} />
            </dt>
            <Icon className="hidden size-4 shrink-0 opacity-70 sm:block" aria-hidden />
          </div>
          <dd className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
            <CountUp value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TilesSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[118px] rounded-2xl sm:h-[136px]" />
      ))}
    </div>
  );
}

async function LatestRows() {
  const items = (await listPublished()).slice(0, 4);
  if (items.length === 0) return null;
  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-background/40">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/s/${item.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {item.title.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-brand">{item.title}</span>
            {item.finalVerdict && <VerdictBadge verdict={item.finalVerdict} />}
          </Link>
        </li>
      ))}
    </ul>
  );
}
