import { HeroPreview } from "@/components/home/hero-preview";
import { T } from "@/components/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats, listPublished, listSources } from "@/lib/data";
import { domainOf } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import type { Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Live numbers under the hero. Phones get three simple tiles; larger screens get
 * the tilting preview of the reviewer workspace.
 */
export async function DashboardPreview() {
  const [stats, published, sources] = await Promise.all([getStats(), listPublished(), listSources()]);
  const tiles: { key: MessageKey; value: number; tone: string }[] = [
    { key: "stats.submitted", value: stats.total, tone: "bg-tint-lime text-tint-lime-foreground" },
    { key: "stats.published", value: stats.published, tone: "bg-tint-coral text-tint-coral-foreground" },
    { key: "stats.waiting", value: stats.needsReview, tone: "bg-tint-sky text-tint-sky-foreground" },
  ];
  return (
    <>
      <dl className="grid grid-cols-3 gap-2.5 text-left md:hidden">
        {tiles.map((tile) => (
          <div key={tile.key} className={cn("flex min-h-28 flex-col justify-between rounded-3xl p-3.5", tile.tone)}>
            <dt className="text-[11px] leading-tight font-semibold opacity-80">
              <T k={tile.key} />
            </dt>
            <dd className="text-3xl font-bold tracking-tight tabular-nums">{tile.value}</dd>
          </div>
        ))}
      </dl>
      <div className="hidden md:block">
        <HeroPreview
          data={{
            submitted: stats.total,
            published: stats.published,
            waiting: stats.needsReview,
            sources: sources.length,
            latest: published.slice(0, 4).map((item) => ({ id: item.id, title: item.title, verdict: item.finalVerdict, domain: domainOf(item.url) })),
            verdictMix: verdictMix(published),
          }}
        />
      </div>
    </>
  );
}

/** How many published verdicts have each rating, most common first. */
function verdictMix(items: { finalVerdict: Verdict | null }[]) {
  const counts = new Map<Verdict, number>();
  for (const item of items) if (item.finalVerdict) counts.set(item.finalVerdict, (counts.get(item.finalVerdict) ?? 0) + 1);
  return [...counts].map(([verdict, count]) => ({ verdict, count })).sort((a, b) => b.count - a.count);
}

export function DashboardPreviewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 md:hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="mx-auto hidden h-[520px] w-full max-w-5xl rounded-[2rem] md:block" />
    </>
  );
}
