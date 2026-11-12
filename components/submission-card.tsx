import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InputTypeIcon } from "@/components/input-type-icon";
import { VerdictBadge } from "@/components/verdict-badge";
import { domainOf, formatDate } from "@/lib/format";
import type { SubmissionSummary } from "@/lib/types";

/** Card used on the home page and the verified claims list. */
export function SubmissionCard({ submission }: { submission: SubmissionSummary }) {
  const domain = domainOf(submission.url);
  return (
    <Link
      href={`/s/${submission.id}`}
      className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-5 transition hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        {submission.finalVerdict && <VerdictBadge verdict={submission.finalVerdict} />}
        <span className="text-xs text-muted-foreground">{formatDate(submission.publishedAt)}</span>
      </div>
      <div className="flex gap-3">
        <InputTypeIcon type={submission.type} />
        <div className="min-w-0">
          <h3 className="font-medium leading-snug text-pretty">{submission.title}</h3>
          {domain && <p className="mt-0.5 truncate text-xs text-muted-foreground">{domain}</p>}
        </div>
      </div>
      {submission.publicNote && (
        <p className="line-clamp-3 text-sm text-muted-foreground">{submission.publicNote}</p>
      )}
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
        See the evidence
        <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
