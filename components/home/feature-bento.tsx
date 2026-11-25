"use client";

import { motion } from "motion/react";
import { Bot, Globe2, ImageIcon, Layers, UserCheck } from "lucide-react";
import { T, useLang, useT } from "@/components/i18n";
import { InView, SplitReveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "features.claims.title",
    text: "features.claims.text",
    icon: Layers,
    tone: "bg-tint-lime text-tint-lime-foreground",
    span: "md:col-span-2",
    visual: "chips",
  },
  {
    title: "features.ai.title",
    text: "features.ai.text",
    icon: Bot,
    tone: "bg-tint-sky text-tint-sky-foreground",
    span: "",
    visual: "lines",
  },
  {
    title: "features.images.title",
    text: "features.images.text",
    icon: ImageIcon,
    tone: "bg-tint-coral text-tint-coral-foreground",
    span: "",
    visual: "bars",
  },
  {
    title: "features.human.title",
    text: "features.human.text",
    icon: UserCheck,
    tone: "bg-tint-ink text-tint-ink-foreground",
    span: "md:col-span-2",
    visual: "nodes",
  },
] as const satisfies readonly { title: MessageKey; text: MessageKey; icon: unknown; tone: string; span: string; visual: string }[];

function Visual({ kind }: { kind: (typeof FEATURES)[number]["visual"] }) {
  if (kind === "chips") {
    return (
      <div className="mt-8 flex flex-wrap gap-2">
        {(["features.chip.reputation", "features.chip.age", "features.chip.claims", "features.chip.factchecks", "features.chip.web"] as const).map((chip, i) => (
          <span
            key={chip}
            className={cn("rounded-full bg-current/10 px-3.5 py-1.5 text-xs font-bold transition-transform duration-500 ease-(--ease-pop) group-hover:-translate-y-1", i % 2 && "group-hover:translate-y-0")}
            style={{ transitionDelay: `${i * 40}ms` }}
          >
            <T k={chip} />
          </span>
        ))}
      </div>
    );
  }
  if (kind === "lines") {
    return (
      <div className="mt-8 space-y-2.5">
        {["w-full", "w-5/6", "w-2/3"].map((w, i) => (
          <span key={i} className={cn("block h-2.5 rounded-full bg-current/15 transition-all duration-700 ease-(--ease-out-soft) group-hover:bg-current/30", w)} />
        ))}
      </div>
    );
  }
  if (kind === "bars") {
    return (
      <div className="mt-8 flex h-14 items-end gap-2">
        {[40, 70, 52, 90, 64].map((h, i) => (
          <span key={i} className="w-full rounded-t-lg bg-current/20 transition-all duration-700 ease-(--ease-pop) group-hover:bg-current/35" style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }} />
        ))}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 300 70" className="mt-8 h-16 w-full max-w-md" fill="none" aria-hidden>
      <path d="M20 45 C80 5, 120 65, 170 30 S 260 10, 285 40" stroke="currentColor" strokeOpacity=".35" strokeWidth="2" strokeDasharray="4 5" />
      {[[20, 45], [100, 38], [170, 30], [285, 40]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill={i === 3 ? "var(--glow)" : "currentColor"} fillOpacity={i === 3 ? 1 : 0.18} stroke="currentColor" strokeOpacity=".5" />
      ))}
    </svg>
  );
}

/** "Engineered for answers you can trust": tinted feature cards that pop in and lift on hover. */
export function FeatureBento() {
  const t = useT();
  const lang = useLang();
  return (
    <section id="features" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-4xl text-center md:mb-20">
          <h2 className="text-4xl leading-[1] font-bold tracking-tight md:text-7xl" key={lang}>
            <SplitReveal inView text={t("features.title1")} />
            <br />
            <SplitReveal inView text={t("features.title2")} delay={0.12} className="text-muted-foreground/70" />
          </h2>
        </div>

        <Stagger className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-5" gap={0.09}>
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title} variant="pop" className={feature.span}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.45, ease: EASE_OUT } }}
                className={cn("group relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[2rem] p-8 md:p-10", feature.tone)}
              >
                <div>
                  <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-current/10 transition-transform duration-500 ease-(--ease-pop) group-hover:scale-110 group-hover:rotate-6">
                    <feature.icon className="size-7" aria-hidden />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">
                    <T k={feature.title} />
                  </h3>
                  <p className="max-w-sm text-base leading-relaxed font-medium opacity-75">
                    <T k={feature.text} />
                  </p>
                </div>
                <Visual kind={feature.visual} />
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        <InView className="mx-auto mt-5 max-w-5xl">
          <div className="glass flex flex-col items-start gap-4 rounded-[2rem] bg-card p-6 ring-1 ring-foreground/[0.07] sm:flex-row sm:items-center md:px-8">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
              <Globe2 className="size-5" aria-hidden />
            </span>
            <p className="text-base text-muted-foreground md:text-lg">
              <span className="font-bold text-foreground">
                <T k="features.languages.title" />
              </span>{" "}
              <T k="features.languages.text" />
            </p>
          </div>
        </InView>
      </div>
    </section>
  );
}
