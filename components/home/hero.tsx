"use client";

import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { T, useLang, useT } from "@/components/i18n";
import { Magnetic, SplitReveal } from "@/components/motion/reveal";
import { StartTourButton } from "@/components/presenter/presenter";
import { CtaButton } from "@/components/ui/cta-button";
import { EASE_OUT } from "@/lib/motion";

/** The home page hero: drifting colour orbs, a word-by-word headline and the two main actions. */
export function Hero({ children }: { children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const t = useT();
  const lang = useLang();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE_OUT },
  });

  return (
    <section className="relative overflow-hidden pt-14 pb-16 md:pt-20 md:pb-24" data-tour="hero">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_55%,transparent)]">
        <div className="orb absolute -top-24 left-[8%] size-[420px] rounded-full bg-tint-lime/60 blur-[110px]" />
        <div className="orb absolute top-40 -right-20 size-[460px] rounded-full bg-tint-sky/60 blur-[120px] [animation-delay:-6s]" />
        <div className="orb absolute bottom-10 left-1/3 size-[380px] rounded-full bg-brand/25 blur-[120px] [animation-delay:-12s]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6">
        <motion.div
          {...fade(0.05)}
          className="glass mb-8 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 ring-1 ring-foreground/[0.08]"
        >
          <Sparkles className="size-4 text-brand" aria-hidden />
          <span className="text-xs font-bold tracking-wide whitespace-nowrap text-muted-foreground uppercase">
            <T k="hero.badge" />
          </span>
        </motion.div>

        <h1 className="mx-auto mb-7 max-w-5xl text-5xl leading-[0.98] font-bold tracking-tight text-balance sm:text-6xl md:text-7xl lg:text-[5.75rem]" key={lang}>
          <SplitReveal text={t("hero.title1")} delay={0.15} />
          <br />
          <SplitReveal text={t("hero.title2")} delay={0.3} className="text-brand" />
        </h1>

        <motion.p {...fade(0.6)} className="mx-auto mb-10 max-w-2xl text-base leading-relaxed font-medium text-muted-foreground md:text-lg">
          <T k="hero.body" />
        </motion.p>

        <motion.div {...fade(0.75)} className="mb-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Magnetic>
            <CtaButton href="/submit">
              <T k="nav.submit" />
            </CtaButton>
          </Magnetic>
          <CtaButton href="/verified" variant="ghost" arrow={false}>
            <T k="hero.browse" />
          </CtaButton>
        </motion.div>
        <motion.div {...fade(0.9)} className="mb-14 md:mb-20">
          <StartTourButton className="text-muted-foreground" />
        </motion.div>

        {children}
      </div>
    </section>
  );
}
