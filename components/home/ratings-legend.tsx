import { Reveal } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";
import { VerdictBadge } from "@/components/verdict-badge";
import { VERDICT_ORDER, VERDICTS } from "@/lib/labels";

export function RatingsLegend() {
  return (
    <section id="ratings" className="scroll-mt-20 border-y bg-card/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="text-sm font-medium tracking-widest text-glow uppercase">Ratings</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">How we rate claims</h2>
          <p className="mt-1 text-muted-foreground">Every published result uses one of these six ratings.</p>
        </Reveal>
        <dl className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VERDICT_ORDER.map((verdict, index) => (
            <Reveal key={verdict} delay={(index % 3) * 100} className="h-full">
              <TiltCard max={4}>
                <div
                  className="relative h-full overflow-hidden rounded-xl border bg-card p-6 backdrop-blur-xl"
                  style={{ boxShadow: `0 20px 50px -30px rgb(${VERDICTS[verdict].rgb} / 0.7)` }}
                >
                  {/* A thin colored light along the top edge */}
                  <div
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, rgb(${VERDICTS[verdict].rgb}), transparent)` }}
                  />
                  <dt>
                    <VerdictBadge verdict={verdict} size="lg" />
                  </dt>
                  <dd className="mt-3 text-sm text-muted-foreground">{VERDICTS[verdict].description}</dd>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
