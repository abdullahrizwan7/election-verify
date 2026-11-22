"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { InView, SplitReveal } from "@/components/motion/reveal";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  { q: "Is it free?", a: "Yes. Submitting a claim and reading every verdict is free, with no account needed to read." },
  { q: "Does the AI decide the verdict?", a: "No. The AI collects evidence and suggests a rating with citations. A trained human reviewer always makes the final decision." },
  { q: "Which sources do you trust?", a: "33 Indian sources: the Election Commission of India, PIB Fact Check, fact-checkers like Alt News, BOOM, FACTLY and Vishvas News, and major newspapers. Admins keep the list up to date." },
  { q: "Can I check a screenshot or a photo?", a: "Yes. We read the text in the image, check its photo details and look for older copies online, which often reveals recycled pictures." },
  { q: "How long does it take?", a: "The evidence is gathered in about a minute. A reviewer usually publishes the verdict the same day." },
  { q: "Which languages are supported?", a: "The site works in English, Hindi and Urdu. You can switch language from the top bar at any time." },
];

/** Frequently asked questions as soft cards that open one at a time. */
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">FAQ</p>
          <h2 className="mt-3 text-4xl leading-[1] font-bold tracking-tight md:text-6xl">
            <SplitReveal inView text="Questions," />
            <br />
            <SplitReveal inView text="answered." delay={0.1} className="text-muted-foreground/70" />
          </h2>
        </div>
        <InView className="space-y-3">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={cn("glass rounded-[1.75rem] ring-1 transition-colors duration-500", isOpen ? "bg-card ring-foreground/10" : "bg-card/60 ring-foreground/[0.06]")}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg font-bold tracking-tight md:px-7"
                >
                  {item.q}
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
                      <p className="px-6 pb-6 text-base leading-relaxed text-muted-foreground md:px-7">{item.a}</p>
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
