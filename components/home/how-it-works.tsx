"use client";

import { Bot, Megaphone, Send, UserCheck } from "lucide-react";
import { T, useLang, useT } from "@/components/i18n";
import { SplitReveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const STEPS: { icon: typeof Send; title: MessageKey; text: MessageKey; tone: string }[] = [
  { icon: Send, title: "how.1.title", text: "how.1.text", tone: "bg-tint-lime text-tint-lime-foreground" },
  { icon: Bot, title: "how.2.title", text: "how.2.text", tone: "bg-tint-sky text-tint-sky-foreground" },
  { icon: UserCheck, title: "how.3.title", text: "how.3.text", tone: "bg-tint-coral text-tint-coral-foreground" },
  { icon: Megaphone, title: "how.4.title", text: "how.4.text", tone: "bg-brand text-brand-foreground" },
];

/** Four steps on a dark card: a sticky title on the left, numbered step rows on the right. */
export function HowItWorks() {
  const t = useT();
  const lang = useLang();
  return (
    <section id="how-it-works" className="scroll-mt-24 px-3 py-10 sm:px-4" data-tour="how">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-tint-ink px-6 py-14 text-tint-ink-foreground md:rounded-[3rem] md:px-14 md:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="orb absolute -top-32 -right-24 size-96 rounded-full bg-brand/30 blur-[110px]" />
          <div className="orb absolute -bottom-32 -left-24 size-96 rounded-full bg-ai/30 blur-[120px] [animation-delay:-9s]" />
        </div>
        <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">
              <T k="how.eyebrow" />
            </p>
            <h2 className="mt-3 text-4xl leading-[1.02] font-bold tracking-tight md:text-6xl" key={lang}>
              <SplitReveal inView text={t("how.title")} />
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/65">
              <T k="how.subtitle" />
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm text-white/60">
              <span className="flex -space-x-2">
                {[Send, Bot, UserCheck].map((Icon, i) => (
                  <span key={i} className={cn("flex size-9 items-center justify-center rounded-full ring-2 ring-tint-ink", STEPS[i].tone)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                ))}
              </span>
              <T k="how.flow" />
            </div>
          </div>

          <Stagger className="space-y-3" gap={0.1}>
            {STEPS.map(({ icon: Icon, title, text, tone }, index) => (
              <StaggerItem key={title}>
                <div className="group flex gap-5 rounded-[1.75rem] bg-white/[0.06] p-5 ring-1 ring-white/10 transition-colors duration-500 hover:bg-white/[0.1] md:p-7">
                  <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 ease-(--ease-pop) group-hover:scale-110 group-hover:-rotate-6", tone)}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-white/40">STEP 0{index + 1}</p>
                    <h3 className="mt-1 text-xl font-bold tracking-tight md:text-2xl">
                      <T k={title} />
                    </h3>
                    <p className="mt-1.5 text-white/65">
                      <T k={text} />
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
