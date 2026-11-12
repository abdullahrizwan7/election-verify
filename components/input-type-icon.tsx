import { FileText, ImageIcon, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { INPUT_TYPES } from "@/lib/labels";
import type { InputType } from "@/lib/types";

const ICONS = { URL: Link2, TEXT: FileText, IMAGE: ImageIcon } satisfies Record<InputType, unknown>;

export function InputTypeIcon({ type, className }: { type: InputType; className?: string }) {
  const Icon = ICONS[type];
  return (
    <span
      className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground", className)}
      title={INPUT_TYPES[type]}
    >
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{INPUT_TYPES[type]}</span>
    </span>
  );
}
