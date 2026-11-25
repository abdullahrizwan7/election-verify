"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { BarChart3, Check, FileSearch, History, Inbox, Library, Plus, Share2, Timer, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { T } from "@/components/i18n";
import { CountUp } from "@/components/motion/reveal";
import { VerdictBadge } from "@/components/verdict-badge";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { VERDICTS } from "@/lib/labels";
import type { Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Everything here is live data from the database. Only published verdicts are shown. */
export type PreviewData = {
  submitted: number;
  published: number;
  waiting: number;
  sources: number;
  latest: { id: string; title: string; verdict: Verdict | null; domain: string | null }[];
  verdictMix: { verdict: Verdict; count: number }[];
};

const TILE_TONES = [
  "bg-tint-lime text-tint-lime-foreground",
  "bg-tint-coral text-tint-coral-foreground",
  "bg-tint-sky text-tint-sky-foreground",
  "bg-tint-ink text-tint-ink-foreground",
];

const TABS = [
  { href: "/review", label: "Queue", icon: Inbox },
  { href: "/review/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/sources", label: "Sources", icon: Library },
  { href: "/admin/activity", label: "Activity", icon: History },
];

/** Opens the phone's share sheet for a verdict, or copies its link. */
async function shareVerdict(id: string, title: string) {
  const url = `${window.location.origin}/s/${id}`;
  try {
    if (navigator.share) await navigator.share({ title, url });
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  } catch {
    // The person closed the share sheet.
  }
}

/**
 * A live snapshot of ElectionVerify under the hero. Numbers, verdicts and the
 * verdict mix come from the database, and every part opens the real page.
 * It tilts towards the mouse on desktop.
 */
export function HeroPreview({ data }: { data: PreviewData }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [4, -4]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-3, 3]);

  const tiles: { label: MessageKey; value: number; icon: typeof Check; href: string }[] = [
    { label: "stats.submitted", value: data.submitted, icon: FileSearch, href: "/verified" },
    { label: "stats.published", value: data.published, icon: Check, href: "/verified" },
    { label: "stats.waiting", value: data.waiting, icon: Timer, href: "/review" },
    { label: "footer.sources", value: data.sources, icon: Library, href: "/about" },
  ];
  const latest = data.latest[0];
  const mixTotal = data.verdictMix.reduce((sum, v) => sum + v.count, 0) || 1;

  return (
    <div
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
          <span className="flex gap-1.5" aria-hidden>
            <i className="size-2.5 rounded-full bg-tint-coral" />
            <i className="size-2.5 rounded-full bg-tint-lime" />
            <i className="size-2.5 rounded-full bg-tint-sky" />
          </span>
          <span className="mx-auto flex items-center gap-2 rounded-full bg-foreground/[0.06] px-4 py-1 text-[11px] font-semibold text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden /> Live from the database
          </span>
          <span className="w-10" />
        </div>

        <div className="relative grid gap-4 p-4 text-left md:grid-cols-[52px_1fr] md:p-6">
          <nav aria-label="Workspace" className="hidden flex-col items-center gap-2 self-start rounded-full bg-dock px-1.5 py-2 ring-1 ring-white/10 md:flex">
            <Link href="/submit" aria-label="Submit a claim" className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground transition-transform hover:scale-110">
              <Plus className="size-4" aria-hidden />
            </Link>
            {TABS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-label={label} className="flex size-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white">
                <Icon className="size-4" aria-hidden />
              </Link>
            ))}
          </nav>

          <div className="min-w-0 space-y-4">
            <nav aria-label="Reviewer pages" className="mx-auto flex w-fit items-center gap-0.5 rounded-full bg-card p-1 ring-1 ring-foreground/[0.07]">
              {TABS.map((tab, i) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors md:px-4 md:text-xs",
                    i === 0 ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>

            <div>
              <p className="text-[11px] font-medium text-muted-foreground">ElectionVerify</p>
              <p className="text-2xl leading-tight font-bold tracking-tight md:text-4xl">Right now</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {tiles.map((tile, i) => (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className={cn("flex h-24 flex-col justify-between rounded-3xl p-4 transition-transform duration-300 hover:-translate-y-1 md:h-28", TILE_TONES[i])}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold opacity-80">
                      <T k={tile.label} />
                    </span>
                    <tile.icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  </div>
                  <span className="text-3xl leading-none font-bold md:text-4xl">
                    <CountUp value={tile.value} delay={0.4 + i * 0.08} />
                  </span>
                </Link>
              ))}
            </div>

            <div className="hidden gap-2.5 md:grid md:grid-cols-5">
              {/* Verdict mix: how the published verdicts break down, from the database */}
              <Link href="/review/analytics" className="rounded-2xl bg-card p-4 ring-1 ring-foreground/[0.07] transition-colors hover:bg-card/80 md:col-span-2">
                <p className="mb-3 text-xs font-bold">Verdict mix</p>
                <ul className="space-y-2">
                  {data.verdictMix.slice(0, 4).map(({ verdict, count }) => (
                    <li key={verdict} className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 shrink-0 truncate font-semibold">
                        <T k={`verdict.${verdict}` as MessageKey} />
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                        <span className={cn("meter block h-full rounded-full", VERDICTS[verdict].dotClassName)} style={{ width: `${Math.max(8, (count / mixTotal) * 100)}%` }} />
                      </span>
                      <span className="w-5 text-right font-bold tabular-nums">{count}</span>
                    </li>
                  ))}
                  {data.verdictMix.length === 0 && <li className="text-[11px] text-muted-foreground">No verdicts published yet.</li>}
                </ul>
              </Link>
              <div className="divide-y divide-foreground/[0.06] overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] md:col-span-3">
                {data.latest.slice(0, 3).map((item) => (
                  <Link key={item.id} href={`/s/${item.id}`} className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-foreground/[0.04]">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border bg-background text-xs font-bold">{item.title.slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{item.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{item.domain ?? "Forwarded message"}</span>
                    </span>
                    {item.verdict && <VerdictBadge verdict={item.verdict} />}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {latest && (
        <FloatingChip className="-top-5 left-6 hidden md:flex lg:left-10" delay={0.7} drift={-6}>
          <Link href={`/s/${latest.id}`} className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-ai/15 text-ai">
              <Check className="size-3.5" aria-hidden />
            </span>
            <span className="max-w-56 truncate text-xs font-semibold">Latest: {latest.title}</span>
          </Link>
        </FloatingChip>
      )}

      <FloatingChip className="-top-5 right-6 hidden md:flex lg:right-10" delay={0.85} drift={6}>
        <Link href="/review" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-tint-sky text-tint-sky-foreground">
            <UserCheck className="size-3.5" aria-hidden />
          </span>
          <span className="text-xs font-semibold">
            {data.waiting === 1 ? "1 claim waiting for a reviewer" : `${data.waiting} claims waiting for a reviewer`}
          </span>
        </Link>
      </FloatingChip>

      {latest?.verdict && (
        <FloatingChip className="inset-x-0 -bottom-5 mx-auto w-fit" delay={1} drift={-6} dark>
          <Check className="size-3.5 text-tint-lime" aria-hidden />
          <span className="text-xs font-semibold whitespace-nowrap">
            <T k={`verdict.${latest.verdict}` as MessageKey} /> · published
          </span>
          <button
            type="button"
            onClick={() => void shareVerdict(latest.id, latest.title)}
            className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-brand-foreground"
          >
            <Share2 className="size-3" aria-hidden /> Share
          </button>
        </FloatingChip>
      )}
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
