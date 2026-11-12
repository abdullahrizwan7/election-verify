import { cn } from "@/lib/utils";
import { percent } from "@/lib/format";

/** A small bar showing how sure the AI is about its suggestion. */
export function ConfidenceMeter({ value, className }: { value: number | null; className?: string }) {
  if (value == null) return <span className="text-xs text-muted-foreground">–</span>;
  const color = value >= 0.8 ? "bg-emerald-500" : value >= 0.6 ? "bg-amber-500" : "bg-red-500";
  return (
    <span className={cn("inline-flex items-center gap-2", className)} title={`AI confidence ${percent(value)}`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", color)} style={{ width: percent(value) }} />
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">{percent(value)}</span>
    </span>
  );
}
