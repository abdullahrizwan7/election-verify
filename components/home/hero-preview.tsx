"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { BarChart3, Check, UserCheck, ClipboardCheck, FileSearch, Inbox, Library, Plus, Sparkles, Timer } from "lucide-react";
import { CountUp } from "@/components/motion/reveal";
import { VerdictBadge } from "@/components/verdict-badge";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/types";

export type PreviewData = {
  submitted: number;
  published: number;
  waiting: number;
  sources: number;
  latest: { id: string; title: string; verdict: Verdict | null; domain: string | null }[];
};

const TILE_TONES = [
  "bg-tint-lime text-tint-lime-foreground",
  "bg-tint-coral text-tint-coral-foreground",
  "bg-tint-sky text-tint-sky-foreground",
  "bg-tint-ink text-tint-ink-foreground",
];

/**
 * A decorative mock of the reviewer workspace under the hero, filled with real
 * numbers. It tilts towards the cursor and carries three floating "live" chips.
 */
export function HeroPreview({ data }: { data: PreviewData }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [5, -5]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-3.5, 3.5]);

  const tiles = [
    { label: "Claims submitted", value: data.submitted, icon: FileSearch },
    { label: "Verdicts published", value: data.published, icon: Check },
    { label: "Awaiting review", value: data.waiting, icon: Timer },
    { label: "Trusted sources", value: data.sources, icon: Library },
  ];
  const boards = data.latest.slice(0, 3);

  return (
    <div
      aria-hidden
      className="rise-in relative mx-auto w-full max-w-5xl"
      style={{ perspective: 1600, "--d": "300ms" } as React.CSSProperties}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="glass overflow-hidden rounded-[2rem] bg-card/70 shadow-[0_50px_120px_-40px_rgba(10,14,12,0.55)] ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-3 border-b border-foreground/[0.07] px-5 py-3">
          <span className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-tint-coral" />
            <i className="size-2.5 rounded-full bg-tint-lime" />
            <i className="size-2.5 rounded-full bg-tint-sky" />
          </span>
          <span className="mx-auto rounded-full bg-foreground/[0.06] px-4 py-1 text-[11px] font-medium text-muted-foreground">
            election-verify.vercel.app/review
          </span>
          <span className="w-10" />
        </div>

        <div className="relative grid gap-4 p-4 text-left md:grid-cols-[52px_1fr] md:p-6">
          <div className="hidden flex-col items-center gap-2 self-start rounded-full bg-dock px-1.5 py-2 ring-1 ring-white/10 md:flex">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Plus className="size-4" />
            </span>
            {[Inbox, BarChart3, Library, ClipboardCheck].map((Icon, i) => (
              <span key={i} className={cn("flex size-9 items-center justify-center rounded-full text-white/60", i === 0 && "bg-white/15 text-white")}>
                <Icon className="size-4" />
              </span>
            ))}
          </div>

          <div className="min-w-0 space-y-4">
            <div className="mx-auto flex w-fit items-center gap-0.5 rounded-full bg-card p-1 ring-1 ring-foreground/[0.07]">
              {["Queue", "Analytics", "Sources", "Activity"].map((tab, i) => (
                <span
                  key={tab}
                  className={cn("rounded-full px-3 py-1.5 text-[11px] font-semibold md:px-4 md:text-xs", i === 0 ? "bg-foreground text-background" : "text-muted-foreground")}
                >
                  {tab}
                </span>
              ))}
            </div>

            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Reviewer workspace</p>
              <p className="text-2xl leading-tight font-bold tracking-tight md:text-4xl">Today's review queue</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {tiles.map((tile, i) => (
                <div key={tile.label} className={cn("flex h-24 flex-col justify-between rounded-3xl p-4 md:h-28", TILE_TONES[i])}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold opacity-80">{tile.label}</span>
                    <tile.icon className="size-3.5 shrink-0 opacity-70" />
                  </div>
                  <span className="text-3xl leading-none font-bold md:text-4xl">
                    <CountUp value={tile.value} delay={0.4 + i * 0.08} />
                  </span>
                </div>
              ))}
            </div>

            {data.latest.length > 0 && (
              <div className="hidden gap-2.5 md:grid md:grid-cols-5">
                <div className="grid grid-cols-3 gap-2.5 md:col-span-2 md:grid-cols-1">
                  {boards.map((item, i) => (
                    <div key={item.id} className={cn("flex h-14 items-center rounded-2xl px-4 text-xs font-bold md:h-12", TILE_TONES[(i + 1) % 4])}>
                      <span className="line-clamp-2 md:truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
                <div className="hidden divide-y divide-foreground/[0.06] overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] md:col-span-3 md:block">
                  {data.latest.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-3.5 py-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border bg-background text-xs font-bold">
                        {item.title.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{item.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{item.domain ?? "Forwarded message"}</span>
                      </span>
                      {item.verdict && <VerdictBadge verdict={item.verdict} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <FloatingChip className="top-28 -left-3 hidden md:flex lg:-left-12" delay={0.7} drift={-10}>
        <span className="flex size-7 items-center justify-center rounded-full bg-ai/15 text-ai">
          <Sparkles className="size-3.5" />
        </span>
        <span className="text-xs font-semibold">
          AI found <span className="text-brand">3 fact-checks</span>
        </span>
      </FloatingChip>

      <FloatingChip className="top-52 -right-3 hidden md:flex lg:-right-12" delay={0.85} drift={10}>
        <span className="flex size-7 items-center justify-center rounded-full bg-tint-sky text-tint-sky-foreground">
          <UserCheck className="size-3.5" />
        </span>
        <span className="text-xs font-semibold">A reviewer is checking</span>
      </FloatingChip>

      <FloatingChip className="inset-x-0 -bottom-5 mx-auto w-fit md:bottom-6" delay={1} drift={-6} dark>
        <Check className="size-3.5 text-tint-lime" />
        <span className="text-xs font-semibold whitespace-nowrap">Verdict published</span>
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-brand-foreground">Share</span>
      </FloatingChip>
    </div>
  );
}

function FloatingChip({ className, delay, drift, dark, children }: { className?: string; delay: number; drift: number; dark?: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("pop-in absolute z-10", className)} style={{ "--d": `${delay * 1000}ms` } as React.CSSProperties}>
      <motion.div
        animate={reduce ? undefined : { y: [0, drift, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay }}
        className={cn(
          "glass flex items-center gap-2.5 rounded-full px-3.5 py-2 shadow-[0_18px_40px_-14px_rgba(10,14,12,0.45)] ring-1",
          dark ? "bg-tint-ink text-tint-ink-foreground ring-white/10" : "bg-card text-foreground ring-foreground/10",
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}
