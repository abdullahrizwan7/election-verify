"use client";

import { T, useLang, useT } from "@/components/i18n";
import { Magnetic, SplitReveal } from "@/components/motion/reveal";
import { CtaButton } from "@/components/ui/cta-button";

/** Closing call to action: a dark card with slow glowing orbs, in the visitor's language. */
export function ClosingCta() {
  const t = useT();
  const lang = useLang();
  return (
    <section className="px-3 py-16 sm:px-4 md:py-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-tint-ink px-6 py-16 text-center text-tint-ink-foreground md:rounded-[3rem] md:p-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="orb absolute -top-24 -left-20 size-80 rounded-full bg-brand/40 blur-[100px]" />
          <div className="orb absolute -right-16 -bottom-24 size-96 rounded-full bg-ai/40 blur-[110px] [animation-delay:-8s]" />
        </div>
        <div className="relative space-y-8">
          <h2 className="text-4xl leading-[1.02] font-bold tracking-tight text-balance md:text-7xl" key={lang}>
            <SplitReveal inView text={t("cta.title1")} />
            <br />
            <SplitReveal inView text={t("cta.title2")} delay={0.12} className="text-white/45" />
          </h2>
          <p className="mx-auto max-w-xl text-lg text-white/65 md:text-xl">
            <T k="cta.body" />
          </p>
          <Magnetic>
            <CtaButton href="/submit">
              <T k="cta.button" />
            </CtaButton>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
