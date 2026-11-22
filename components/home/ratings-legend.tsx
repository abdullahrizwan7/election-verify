import { InView } from "@/components/motion/reveal";
import { T } from "@/components/i18n";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { VERDICT_ORDER, VERDICTS } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** The six ratings as tinted tiles. */
export function RatingsLegend() {
  return (
    <section id="ratings" className="scroll-mt-24 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <InView className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">
              <T k="ratings.eyebrow" />
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              <T k="ratings.title" />
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground">
            <T k="ratings.subtitle" />
          </p>
        </InView>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {VERDICT_ORDER.map((verdict, index) => (
            <InView key={verdict} delay={index * 0.06} className="h-full">
              <div className={cn("group flex h-full min-h-44 flex-col justify-between rounded-[1.75rem] p-5 transition-transform duration-500 ease-(--ease-pop) hover:-translate-y-1.5 hover:-rotate-1", VERDICTS[verdict].tone)}>
                <span className="font-mono text-xs font-semibold opacity-60">0{index + 1}</span>
                <div>
                  <dt className="text-xl leading-tight font-bold tracking-tight">
                    <T k={`verdict.${verdict}` as MessageKey} />
                  </dt>
                  <dd className="mt-1.5 text-[13px] leading-snug opacity-75">
                    <T k={`verdictDesc.${verdict}` as MessageKey} />
                  </dd>
                </div>
              </div>
            </InView>
          ))}
        </dl>
      </div>
    </section>
  );
}
