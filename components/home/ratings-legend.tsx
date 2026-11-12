import { VerdictBadge } from "@/components/verdict-badge";
import { VERDICT_ORDER, VERDICTS } from "@/lib/labels";

export function RatingsLegend() {
  return (
    <section id="ratings" className="scroll-mt-20 border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">How we rate claims</h2>
        <p className="mt-1 text-muted-foreground">Every published result uses one of these six ratings.</p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VERDICT_ORDER.map((verdict) => (
            <div key={verdict} className="rounded-xl border bg-card p-5">
              <dt>
                <VerdictBadge verdict={verdict} size="lg" />
              </dt>
              <dd className="mt-3 text-sm text-muted-foreground">{VERDICTS[verdict].description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
