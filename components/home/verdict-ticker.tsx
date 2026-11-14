import Link from "next/link";
import { VerdictBadge } from "@/components/verdict-badge";
import { T } from "@/components/i18n";
import { listPublished } from "@/lib/data";

/** A slowly scrolling strip of the latest verdicts. Hover to pause it. */
export async function VerdictTicker() {
  const items = (await listPublished()).slice(0, 10);
  if (items.length === 0) return null;
  // The list is drawn twice so the loop has no visible jump.
  const loop = [...items, ...items, ...items, ...items];

  return (
    <section aria-label="Latest verdicts" className="relative flex items-center overflow-hidden border-y bg-card/40 backdrop-blur">
      <span className="relative z-10 flex shrink-0 items-center gap-2 border-r bg-background/80 px-4 py-3 text-xs font-semibold tracking-widest text-glow uppercase">
        <span className="size-1.5 animate-pulse-ring rounded-full bg-glow" /> <T k="ticker.latest" />
      </span>
      <div className="group relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
        <div className="flex w-max animate-marquee gap-10 py-3 group-hover:[animation-play-state:paused]">
          {loop.map((item, index) => {
            const copy = index >= items.length;
            return (
              <Link
                key={`${item.id}-${index}`}
                href={`/s/${item.id}`}
                aria-hidden={copy || undefined}
                tabIndex={copy ? -1 : undefined}
                className="flex items-center gap-2.5 text-sm whitespace-nowrap text-muted-foreground transition hover:text-foreground"
              >
                {item.finalVerdict && <VerdictBadge verdict={item.finalVerdict} />}
                <span className="max-w-[26rem] truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
