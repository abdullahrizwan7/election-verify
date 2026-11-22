"use client";

import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { T, useLang, useT } from "@/components/i18n";
import { Magnetic } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { StartTourButton } from "@/components/presenter/presenter";
import { CtaButton } from "@/components/ui/cta-button";
import { cn } from "@/lib/utils";

const LONG_WORDS = ["ta", "ml"];

/** Delay for a CSS entrance (see .rise-in in globals.css). */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * The home page hero: drifting colour orbs, a word-by-word headline and the two
 * main actions. Entrances are CSS, so the hero shows at first paint even on slow phones.
 */
export function Hero({ children }: { children?: React.ReactNode }) {
  const t = useT();
  const lang = useLang();

  return (
    <section className="relative overflow-hidden pt-14 pb-16 md:pt-20 md:pb-24" data-tour="hero">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_55%,transparent)]">
        <div className="orb absolute -top-24 left-[8%] size-[420px] rounded-full bg-tint-lime/60 blur-[110px]" />
        <div className="orb absolute top-40 -right-20 size-[460px] rounded-full bg-tint-sky/60 blur-[120px] [animation-delay:-6s]" />
        <div className="orb absolute bottom-10 left-1/3 size-[380px] rounded-full bg-brand/25 blur-[120px] [animation-delay:-12s]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6">
        <div className="rise-in glass mb-8 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 ring-1 ring-foreground/[0.08]">
          <Sparkles className="size-4 text-brand" aria-hidden />
          <span className="text-xs font-bold tracking-wide whitespace-nowrap text-muted-foreground uppercase">
            <T k="hero.badge" />
          </span>
        </div>

        <h1
          className={cn(
            "mx-auto mb-7 max-w-5xl leading-[0.98] font-bold tracking-tight text-balance",
            // Tamil and Malayalam have long words, so their headline starts smaller on phones.
            LONG_WORDS.includes(lang) ? "text-[2.1rem] sm:text-5xl md:text-6xl lg:text-7xl" : "text-5xl sm:text-6xl md:text-7xl lg:text-[5.75rem]",
          )}
          key={lang}
        >
          <SplitText text={t("hero.title1")} delay={60} />
          <br />
          <SplitText text={t("hero.title2")} delay={180} className="text-brand" />
        </h1>

        <p className="rise-in mx-auto mb-10 max-w-2xl text-base leading-relaxed font-medium text-muted-foreground md:text-lg" style={d(280)}>
          <T k="hero.body" />
        </p>

        <div className="rise-in mb-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4" style={d(360)}>
          <Magnetic>
            <CtaButton href="/submit">
              <T k="nav.submit" />
            </CtaButton>
          </Magnetic>
          <CtaButton href="/verified" variant="ghost" arrow={false}>
            <T k="hero.browse" />
          </CtaButton>
        </div>
        <div className="rise-in mb-14 md:mb-20" style={d(440)}>
          <StartTourButton className="text-muted-foreground" />
        </div>

        {children}
      </div>
    </section>
  );
}
