import { cn } from "@/lib/utils";
import { VERDICTS } from "@/lib/labels";
import type { Verdict } from "@/lib/types";

export function VerdictBadge({
  verdict,
  size = "default",
  className,
}: {
  verdict: Verdict;
  size?: "default" | "lg";
  className?: string;
}) {
  const meta = VERDICTS[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs",
        meta.className,
        className,
      )}
    >
      <span className={cn("rounded-full", size === "lg" ? "size-2" : "size-1.5", meta.dotClassName)} aria-hidden />
      {meta.label}
    </span>
  );
}
