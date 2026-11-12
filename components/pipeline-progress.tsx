import { CheckCircle2, Circle, CircleSlash, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STEPS } from "@/lib/labels";
import type { PipelineSteps, StepState } from "@/lib/types";

const STATE_ICON: Record<StepState, { icon: typeof Circle; className: string; label: string }> = {
  pending: { icon: Circle, className: "text-muted-foreground/50", label: "Waiting" },
  running: { icon: Loader2, className: "animate-spin text-primary", label: "In progress" },
  done: { icon: CheckCircle2, className: "text-emerald-600", label: "Done" },
  skipped: { icon: CircleSlash, className: "text-muted-foreground/60", label: "Skipped" },
  failed: { icon: XCircle, className: "text-destructive", label: "Failed" },
};

/** The list of verification steps with a tick, spinner or cross for each. */
export function PipelineProgress({ steps, compact = false }: { steps: PipelineSteps; compact?: boolean }) {
  return (
    <ol className="space-y-1">
      {PIPELINE_STEPS.map((step) => {
        const state = steps[step.key] ?? "pending";
        const { icon: Icon, className, label } = STATE_ICON[state];
        return (
          <li
            key={step.key}
            className={cn(
              "flex gap-3 rounded-lg px-2 py-2",
              state === "running" && "bg-primary/5",
              state === "failed" && "bg-destructive/5",
            )}
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden />
            <div className="min-w-0 flex-1">
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
  );
}
