import { HeroPreview } from "@/components/home/hero-preview";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats, listPublished, listSources } from "@/lib/data";
import { domainOf } from "@/lib/format";

/** Loads the real numbers for the hero's workspace preview. */
export async function DashboardPreview() {
  const [stats, published, sources] = await Promise.all([getStats(), listPublished(), listSources()]);
  return (
    <HeroPreview
      data={{
        submitted: stats.total,
        published: stats.published,
        waiting: stats.needsReview,
        sources: sources.length,
        latest: published.slice(0, 4).map((item) => ({ id: item.id, title: item.title, verdict: item.finalVerdict, domain: domainOf(item.url) })),
      }}
    />
  );
}

export function DashboardPreviewSkeleton() {
  return <Skeleton className="mx-auto h-[520px] w-full max-w-5xl rounded-[2rem]" />;
}
