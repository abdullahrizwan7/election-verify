"use client";

import { ClipboardCheck, Send, ShieldCheck } from "lucide-react";
import { T, useLang, useT } from "@/components/i18n";
import { SplitReveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const ROLES = [
  { key: "citizen", icon: Send, tone: "bg-tint-coral text-tint-coral-foreground" },
  { key: "reviewer", icon: ClipboardCheck, tone: "bg-tint-sky text-tint-sky-foreground" },
  { key: "admin", icon: ShieldCheck, tone: "bg-tint-lime text-tint-lime-foreground" },
] as const;

/** The three roles in the flow, from a doubtful message to a published answer. */
export function TeamVoices() {
  const t = useT();
  const lang = useLang();
  return (
    <section id="roles" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">
            <T k="roles.eyebrow" />
          </p>
          <h2 className="mt-3 text-4xl leading-[1] font-bold tracking-tight md:text-6xl" key={lang}>
            <SplitReveal inView text={t("roles.title")} />
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            <T k="roles.subtitle" />
          </p>
        </div>
        <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5" gap={0.1}>
          {ROLES.map(({ key, icon: Icon, tone }) => (
            <StaggerItem key={key} variant="pop">
              <div className="glass group flex h-full flex-col rounded-[2rem] bg-card p-7 ring-1 ring-foreground/[0.07] transition-transform duration-500 ease-(--ease-out-soft) hover:-translate-y-1.5 md:p-8">
                <span className={cn("flex size-14 items-center justify-center rounded-2xl transition-transform duration-500 ease-(--ease-pop) group-hover:scale-110 group-hover:-rotate-6", tone)}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight">
                  <T k={`roles.${key}.title`} />
                </h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                  <T k={`roles.${key}.text`} />
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {(["p1", "p2", "p3"] as const).map((point) => (
                    <li key={point} className="rounded-full bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold">
                      <T k={`roles.${key}.${point}`} />
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
