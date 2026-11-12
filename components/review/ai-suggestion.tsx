import { Fragment } from "react";
import { Sparkles, TriangleAlert } from "lucide-react";
import { ConfidenceMeter } from "@/components/review/confidence-meter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerdictBadge } from "@/components/verdict-badge";
import type { Evidence, SubmissionDetail } from "@/lib/types";

/**
 * The AI's suggested verdict and summary. Citations like [ev-1a] become links
 * to the matching evidence card. A citation that points at evidence that does
 * not exist is highlighted in red, because the AI may have made it up.
 */
export function AiSuggestion({ submission }: { submission: SubmissionDetail }) {
  if (!submission.aiVerdict) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" aria-hidden /> AI suggestion
          </CardTitle>
          <CardDescription>Appears here when the analysis finishes.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" aria-hidden /> AI suggestion
        </CardTitle>
        <CardDescription>A starting point for you, not a decision. It is never shown to the public.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <VerdictBadge verdict={submission.aiVerdict} size="lg" />
          <ConfidenceMeter value={submission.aiConfidence} />
        </div>
        {submission.aiSummary && (
          <p className="text-sm leading-relaxed">
            <SummaryWithCitations text={submission.aiSummary} evidence={submission.evidence} />
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryWithCitations({ text, evidence }: { text: string; evidence: Evidence[] }) {
  const ids = new Set(evidence.map((e) => e.id));
  const parts = text.split(/(\[[\w-]+\])/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[([\w-]+)\]$/);
    if (!match) return <Fragment key={index}>{part}</Fragment>;

    const id = match[1];
    if (!ids.has(id)) {
      return (
        <span key={index} className="mx-0.5 inline-flex items-center gap-0.5 rounded bg-destructive/10 px-1 text-xs text-destructive" title="This evidence ID does not exist">
          <TriangleAlert className="size-3" aria-hidden /> {id}
        </span>
      );
    }
    return (
      <a key={index} href={`#evidence-${id}`} className="mx-0.5 rounded bg-muted px-1 font-mono text-xs text-primary hover:underline">
        {id}
      </a>
    );
  });
}
