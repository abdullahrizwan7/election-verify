"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Slides the header in on load and gives the islands a deeper shadow once the page scrolls. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      data-scrolled={scrolled}
      className={cn(
        "sticky top-0 z-40 mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2.5 px-3 py-3 transition-[padding] duration-500 sm:px-4 md:grid md:grid-cols-[1fr_auto_1fr]",
        "[&>*]:transition-shadow [&>*]:duration-500 data-[scrolled=true]:py-2 data-[scrolled=true]:[&>*]:shadow-[0_18px_50px_-20px_rgba(10,14,12,0.45)]",
      )}
    >
      {children}
    </motion.header>
  );
}
