import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { InputTypeIcon } from "@/components/input-type-icon";
import { T } from "@/components/i18n";
import { domainOf, formatDate } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { VERDICTS } from "@/lib/labels";
import type { SubmissionSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A verified claim: a tinted "verdict" panel on top (colour = rating), then the
 * claim, its source and the date on a frosted body.
 */
export function SubmissionCard({ submission }: { submission: SubmissionSummary }) {
  const domain = domainOf(submission.url);
  const verdict = submission.finalVerdict;
  const meta = verdict ? VERDICTS[verdict] : null;

  return (
    <Link
      href={`/s/${submission.id}`}
      className="glass group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-card p-2 ring-1 ring-foreground/[0.07] transition-[transform,box-shadow] duration-500 ease-(--ease-out-soft) hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(10,14,12,0.45)]"
    >
      <div className={cn("relative flex h-32 flex-col justify-between overflow-hidden rounded-[1.35rem] p-4", meta?.tone ?? "bg-muted")}>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-current/10 px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase">
            <InputTypeLabel type={submission.type} />
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-current/10 transition-transform duration-500 ease-(--ease-pop) group-hover:rotate-45">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
        {verdict && (
          <p className="text-3xl leading-none font-bold tracking-tight">
            <T k={`verdict.${verdict}` as MessageKey} />
          </p>
        )}
        <span aria-hidden className="absolute -right-6 -bottom-8 size-28 rounded-full bg-current/10 transition-transform duration-700 ease-(--ease-out-soft) group-hover:scale-125" />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 pt-4 pb-3">
        <h3 className="line-clamp-2 text-[17px] leading-snug font-bold tracking-tight text-pretty">{submission.title}</h3>
        {submission.publicNote && <p className="line-clamp-2 text-sm text-muted-foreground">{submission.publicNote}</p>}
        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <InputTypeIcon type={submission.type} className="size-6 rounded-full bg-foreground/[0.06] [&_svg]:size-3" />
          <span className="truncate">{domain ?? "Forwarded message"}</span>
          <span className="ml-auto shrink-0">{formatDate(submission.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function InputTypeLabel({ type }: { type: SubmissionSummary["type"] }) {
  return <>{type === "URL" ? "Link" : type === "IMAGE" ? "Image" : "Message"}</>;
}
