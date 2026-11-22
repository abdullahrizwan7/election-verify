import type { Transition, Variants } from "motion/react";

/**
 * Motion vocabulary: one house easing for movement (≈ power3.out) and a springy
 * "pop" (≈ back.out) for things that appear.
 */
export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;
export const EASE_POP = [0.34, 1.56, 0.64, 1] as const;

export const tween = (duration = 0.55, delay = 0): Transition => ({ duration, delay, ease: EASE_OUT });
export const pop = (duration = 0.6, delay = 0): Transition => ({ duration, delay, ease: EASE_POP });

/** Container that staggers its `item` children. */
export const stagger = (gap = 0.05, delayChildren = 0.04): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren } },
});

/** Rise and fade (lists, rows, sections). */
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: tween(0.7) },
};

/** Scale pop (cards, chips, tiles). */
export const popItem: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: pop(0.65) },
};
