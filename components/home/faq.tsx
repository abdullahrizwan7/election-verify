"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { T, useLang, useT } from "@/components/i18n";
import { InView, SplitReveal } from "@/components/motion/reveal";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const QUESTIONS = [1, 2, 3, 4, 5, 6] as const;

/** Frequently asked questions as soft cards that open one at a time. */
export function Faq() {
  const [open, setOpen] = useState(0);
  const t = useT();
  const lang = useLang();
  return (
    <section id="faq" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">FAQ</p>
          <h2 className="mt-3 text-4xl leading-[1] font-bold tracking-tight md:text-6xl" key={lang}>
            <SplitReveal inView text={t("faq.title1")} />
            <br />
            <SplitReveal inView text={t("faq.title2")} delay={0.1} className="text-muted-foreground/70" />
          </h2>
        </div>
        <InView className="space-y-3">
          {QUESTIONS.map((n, i) => {
            const isOpen = open === i;
            return (
              <div key={n} className={cn("glass rounded-[1.75rem] ring-1 transition-colors duration-500", isOpen ? "bg-card ring-foreground/10" : "bg-card/60 ring-foreground/[0.06]")}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg font-bold tracking-tight md:px-7"
                >
                  <T k={`faq.q${n}`} />
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-500 ease-(--ease-pop)",
                      isOpen ? "rotate-45 bg-foreground text-background" : "bg-foreground/[0.06]",
                    )}
                  >
                    <Plus className="size-4" aria-hidden />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-base leading-relaxed text-muted-foreground md:px-7">
                        <T k={`faq.a${n}`} />
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </InView>
      </div>
    </section>
  );
}
