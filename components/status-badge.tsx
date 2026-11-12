import { cn } from "@/lib/utils";
import { STATUSES } from "@/lib/labels";
import type { Status } from "@/lib/types";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const meta = STATUSES[status];
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap", meta.className, className)}>
      {status === "PROCESSING" && <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-current" aria-hidden />}
      {meta.label}
    </span>
  );
}
