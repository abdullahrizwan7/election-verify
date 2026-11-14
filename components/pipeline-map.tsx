import { BrainCircuit, FileSearch, Globe, ListChecks, ScanEye, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STEPS } from "@/lib/labels";
import type { PipelineStepKey, PipelineSteps, StepState } from "@/lib/types";

const ICONS: Record<PipelineStepKey, typeof Globe> = {
  extract: FileSearch,
  sourceInfo: Globe,
  image: ScanEye,
  claims: ListChecks,
  factCheck: ShieldCheck,
  webEvidence: Search,
  synthesize: BrainCircuit,
};

const NODE: Record<StepState, string> = {
  pending: "border-border text-muted-foreground/60 bg-card",
  running: "border-glow text-glow bg-glow/15 shadow-[0_0_30px_-4px] shadow-glow/70",
  done: "border-emerald-500/70 text-emerald-500 bg-emerald-500/10 shadow-[0_0_24px_-8px] shadow-emerald-500/70",
  skipped: "border-dashed border-border text-muted-foreground/50 bg-card",
  failed: "border-destructive text-destructive bg-destructive/10 shadow-[0_0_24px_-8px] shadow-destructive/70",
};

/**
 * The checking steps drawn as a row of connected nodes. Finished links glow,
 * and a dot of light travels into the step that is running right now.
 * Shown on wide screens; phones see the list version (PipelineProgress).
 */
export function PipelineMap({ steps, className }: { steps: PipelineSteps; className?: string }) {
  return (
    <ol className={cn("hidden items-start md:flex", className)} aria-label="Verification steps">
      {PIPELINE_STEPS.map((step, index) => {
        const state = steps[step.key] ?? "pending";
        const next = PIPELINE_STEPS[index + 1];
        const nextState = next ? (steps[next.key] ?? "pending") : null;
        const Icon = ICONS[step.key];
        const linkLit = state === "done" || state === "skipped";

        return (
          <li key={step.key} className="relative flex flex-1 flex-col items-center text-center">
            {/* Link to the next node */}
            {next && (
              <div className="absolute top-6 left-[calc(50%+28px)] h-0.5 w-[calc(100%-56px)] overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full bg-gradient-to-r from-emerald-500/80 to-glow transition-all duration-700", linkLit ? "w-full" : "w-0")}
                />
                {nextState === "running" && (
                  <span className="absolute top-1/2 size-2 -translate-y-1/2 animate-packet rounded-full bg-glow shadow-[0_0_10px_2px] shadow-glow" />
                )}
              </div>
            )}

            <span
              className={cn(
                "relative flex size-12 items-center justify-center rounded-2xl border-2 backdrop-blur transition-all duration-500",
                NODE[state],
              )}
            >
              {state === "running" && <span className="absolute -inset-1.5 animate-spin rounded-[1.1rem] border-2 border-transparent border-t-glow/80 [animation-duration:1.6s]" />}
              <Icon className="size-5" aria-hidden />
            </span>
            <span className={cn("mt-2 px-1 text-xs font-medium leading-tight", state === "pending" || state === "skipped" ? "text-muted-foreground" : "")}>
              {step.label}
            </span>
            <span className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">{state === "running" ? "working" : state}</span>
          </li>
        );
      })}
    </ol>
  );
}
