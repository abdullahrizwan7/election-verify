"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { cn } from "@/lib/utils";

/** Gives the header islands a deeper shadow once the page scrolls. Visible from the first paint. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        "sticky top-0 z-40 mx-auto flex w-full max-w-7xl items-center justify-between gap-2.5 px-3 py-3 transition-[padding] duration-500 sm:px-4 md:grid md:grid-cols-[1fr_auto_1fr]",
        "[&>*]:transition-shadow [&>*]:duration-500 data-[scrolled=true]:py-2 data-[scrolled=true]:[&>*]:shadow-[0_18px_50px_-20px_rgba(10,14,12,0.45)]",
      )}
    >
      {children}
    </header>
  );
}
