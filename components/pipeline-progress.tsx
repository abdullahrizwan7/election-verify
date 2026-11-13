import { CheckCircle2, Circle, CircleSlash, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STEPS } from "@/lib/labels";
import type { PipelineSteps, StepState } from "@/lib/types";

const STATE_ICON: Record<StepState, { icon: typeof Circle; className: string; label: string }> = {
  pending: { icon: Circle, className: "text-muted-foreground/50", label: "Waiting" },
  running: { icon: Loader2, className: "animate-spin text-glow", label: "In progress" },
  done: { icon: CheckCircle2, className: "text-emerald-500", label: "Done" },
  skipped: { icon: CircleSlash, className: "text-muted-foreground/60", label: "Skipped" },
  failed: { icon: XCircle, className: "text-destructive", label: "Failed" },
};

/** The list of verification steps with a tick, spinner or cross for each, and an overall progress bar. */
export function PipelineProgress({ steps, compact = false }: { steps: PipelineSteps; compact?: boolean }) {
  const finished = PIPELINE_STEPS.filter((s) => steps[s.key] === "done" || steps[s.key] === "skipped").length;
  const percent = Math.round((finished / PIPELINE_STEPS.length) * 100);
  const running = PIPELINE_STEPS.some((s) => steps[s.key] === "running");

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{running ? "Checking…" : percent === 100 ? "All steps finished" : "Progress"}</span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-glow to-glow-2 shadow-[0_0_12px] shadow-glow/60 transition-[width] duration-700"
              style={{ width: `${percent}%` }}
            />
            {running && <div className="absolute inset-y-0 w-1/4 animate-scan bg-white/50 blur-[2px]" />}
          </div>
        </div>
      )}

      <ol className="space-y-1">
        {PIPELINE_STEPS.map((step) => {
          const state = steps[step.key] ?? "pending";
          const { icon: Icon, className, label } = STATE_ICON[state];
          return (
            <li
              key={step.key}
              className={cn(
                "relative flex gap-3 overflow-hidden rounded-lg px-2 py-2",
                state === "running" && "bg-glow/10 ring-1 ring-glow/30",
                state === "failed" && "bg-destructive/10",
              )}
            >
              {state === "running" && (
                <div aria-hidden className="absolute inset-y-0 w-1/3 animate-scan bg-gradient-to-r from-transparent via-glow/15 to-transparent" />
              )}
              <Icon className={cn("relative mt-0.5 size-4 shrink-0", className)} aria-hidden />
              <div className="relative min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn("text-sm font-medium", (state === "pending" || state === "skipped") && "text-muted-foreground")}>
                    {step.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                {!compact && <p className="text-xs text-muted-foreground">{step.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
