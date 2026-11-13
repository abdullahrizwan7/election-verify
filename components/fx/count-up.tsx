"use client";

import { useEffect, useRef } from "react";

/** Counts a number up from zero. The server sends the final number, so it's correct even without JavaScript. */
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(value * (1 - Math.pow(1 - t, 3))).toLocaleString();
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString()}
    </span>
  );
}
