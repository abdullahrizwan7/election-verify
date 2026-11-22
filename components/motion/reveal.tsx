"use client";

import * as React from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, popItem, riseItem, stagger } from "@/lib/motion";

/** Staggers any <StaggerItem> children in as the block enters the viewport. */
export function Stagger({ className, gap = 0.06, delay = 0.04, children, ...props }: HTMLMotionProps<"div"> & { gap?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={stagger(gap, delay)}
      initial={reduce ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: "some" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ className, variant = "rise", ...props }: HTMLMotionProps<"div"> & { variant?: "rise" | "pop" }) {
  return <motion.div className={className} variants={variant === "pop" ? popItem : riseItem} {...props} />;
}

/** One block that rises in when it scrolls into view. */
export function InView({ className, delay = 0, y = 18, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
      {...props}
    />
  );
}

/**
 * Headline reveal: each word rises out of its own mask. The text stays one
 * accessible string for screen readers.
 */
export function SplitReveal({
  text,
  className,
  delay = 0,
  inView = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  /** Play when scrolled into view instead of on load (for headings lower on the page). */
  inView?: boolean;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((word, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden pb-[0.12em] align-bottom"
          initial={reduce ? "visible" : "hidden"}
          {...(inView ? { whileInView: "visible", viewport: { once: true, amount: "some" as const } } : { animate: "visible" })}
        >
          <motion.span
            className="inline-block origin-bottom-left"
            variants={{
              hidden: { y: "115%", rotate: 6 },
              visible: { y: "0%", rotate: 0, transition: { duration: 0.85, delay: delay + i * 0.045, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </motion.span>
      ))}
    </span>
  );
}

/** A number that counts up when it scrolls into view. The server sends the real value first. */
export function CountUp({ value, duration = 1.2, delay = 0, className }: { value: number; duration?: number; delay?: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduce || !inView) return;
    const controls = animate(0, value, {
      duration,
      delay,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [value, inView, reduce, duration, delay]);

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)}>
      {value.toLocaleString()}
    </span>
  );
}

/** Pulls its child a few pixels towards the cursor (main buttons). */
export function Magnetic({ children, strength = 0.28, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  return (
    <motion.span
      className={cn("inline-flex", className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** Lifts a card on hover and presses it on tap. */
export function Lift({ className, ...props }: HTMLMotionProps<"div">) {
  return <motion.div className={className} whileHover={{ y: -6, transition: { duration: 0.45, ease: EASE_OUT } }} whileTap={{ scale: 0.985 }} {...props} />;
}
