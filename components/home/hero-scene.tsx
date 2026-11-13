"use client";

import { useRef } from "react";
import { BadgeCheck, FileSearch, ScanText, ShieldCheck, UserCheck } from "lucide-react";
import { Globe } from "@/components/fx/globe";
import { VerdictBadge } from "@/components/verdict-badge";
import { cn } from "@/lib/utils";

/**
 * The 3D picture next to the headline: a turning globe, a result card floating
 * in front of it, and evidence chips at different depths. The whole scene leans
 * gently towards the mouse (parallax). It is decoration only (aria-hidden).
 */
export function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const el = sceneRef.current;
    if (!el || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--scene-ry", `${-14 + x * 10}deg`);
    el.style.setProperty("--scene-rx", `${8 - y * 8}deg`);
  }

  function onPointerLeave() {
    sceneRef.current?.style.removeProperty("--scene-ry");
    sceneRef.current?.style.removeProperty("--scene-rx");
  }

  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[540px] [perspective:1400px]" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      {/* Halo and globe */}
      <div className="absolute inset-[8%] rounded-full bg-glow/20 blur-3xl" />
      <Globe className="absolute inset-0" />

      {/* Everything in front of the globe tilts together in 3D */}
      <div
        ref={sceneRef}
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ transform: "rotateY(var(--scene-ry, -14deg)) rotateX(var(--scene-rx, 8deg))", transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute top-1/2 left-1/2 w-[82%] sm:w-[74%]"
          style={{ transform: "translate3d(-50%, -46%, 60px)", transformStyle: "preserve-3d" }}
        >
          <div className="border-gradient relative overflow-hidden rounded-2xl p-5 shadow-[0_30px_80px_-20px_color-mix(in_oklch,var(--glow)_45%,transparent)]">
            <div className="absolute inset-0 -z-10 bg-card backdrop-blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Forwarded message</span>
              <VerdictBadge verdict="FALSE" className="shadow-[0_0_20px_-4px_rgb(239_68_68/0.7)]" />
            </div>
            <p className="mt-3 rounded-lg bg-muted p-3 text-xs sm:text-sm">
              “All polling stations will close at 2 PM this year. Go early or you can’t vote.”
            </p>

            {/* A scanning bar to suggest the analysis in progress */}
            <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-glow/70 via-glow-2/70 to-glow/70" />
              <div className="absolute inset-y-0 w-1/3 animate-scan bg-white/60 blur-[2px]" />
            </div>

            <ul className="mt-4 space-y-2 text-xs sm:space-y-2.5 sm:text-sm">
              <Row icon={FileSearch} label="Official schedule" value="polls open 8 AM – 5 PM" />
              <Row icon={ShieldCheck} label="Fact-check found" value="rated False" />
              <Row icon={UserCheck} label="Human reviewed" value="before publishing" />
            </ul>
          </div>
        </div>

        <Chip className="top-[6%] left-[0%] hidden sm:flex" z={120} delay={0} icon={BadgeCheck}>
          Official source matched
        </Chip>
        <Chip className="top-[13%] right-[-2%] hidden sm:flex" z={160} delay={1.2} icon={ScanText}>
          Text read from image
        </Chip>
        <Chip className="right-[4%] bottom-[0%] flex sm:bottom-[8%]" z={140} delay={2.1} icon={ShieldCheck}>
          3 sources checked
        </Chip>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof FileSearch; label: string; value: string }) {
  return (
    <li className="flex gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-glow" />
      <span>
        <span className="font-medium">{label}:</span> <span className="text-muted-foreground">{value}</span>
      </span>
    </li>
  );
}

function Chip({
  children,
  className,
  z,
  delay,
  icon: Icon,
}: {
  children: React.ReactNode;
  className: string;
  z: number;
  delay: number;
  icon: typeof FileSearch;
}) {
  return (
    <div
      className={cn(
        "absolute animate-float items-center gap-2 rounded-full border border-glow/30 bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-[0_10px_30px_-10px_color-mix(in_oklch,var(--glow)_60%,transparent)] backdrop-blur-xl",
        className,
      )}
      style={{ "--z": `${z}px`, animationDelay: `${delay}s` } as React.CSSProperties}
    >
      <Icon className="size-3.5 text-glow" />
      {children}
    </div>
  );
}
