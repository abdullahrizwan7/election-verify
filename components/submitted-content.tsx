import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { T } from "@/components/i18n";
import { domainOf, formatDateTime } from "@/lib/format";
import { INPUT_TYPES } from "@/lib/labels";
import type { SubmissionDetail } from "@/lib/types";

/** Shows exactly what was submitted: the link, the text and/or the image. */
export function SubmittedContent({ submission }: { submission: SubmissionDetail }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">
          <T k="result.submitted" />
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {INPUT_TYPES[submission.type]} · {formatDateTime(submission.createdAt)}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {submission.url && (
          <a
            href={submission.url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50"
          >
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0">
              <span className="block font-medium">{domainOf(submission.url)}</span>
              <span className="block truncate text-muted-foreground">{submission.url}</span>
            </span>
          </a>
        )}

        {submission.imageUrl && (
          <div className="overflow-hidden rounded-lg border bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element -- user uploads come from storage with signed URLs */}
            <img src={submission.imageUrl} alt="The submitted image" className="mx-auto max-h-96 object-contain" />
          </div>
        )}

        {submission.text && submission.type === "URL" ? (
          // Articles can be long, so show the start and let people expand the rest.
          <details className="group rounded-lg border bg-muted/30 text-sm">
            <summary className="cursor-pointer list-none p-4">
              <span className="mb-2 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Article text we read · {submission.text.split(/\s+/).length.toLocaleString()} words
              </span>
              <span className="line-clamp-4 group-open:hidden">{submission.text}</span>
              <span className="mt-2 block text-xs font-medium text-primary group-open:hidden">Show full text</span>
            </summary>
            <div className="max-h-[32rem] overflow-y-auto px-4 pb-4 whitespace-pre-line">{submission.text}</div>
          </details>
        ) : (
          submission.text && (
            <blockquote className="rounded-lg border-l-4 border-primary/40 bg-muted/50 p-4 text-sm whitespace-pre-line">
              {submission.text}
            </blockquote>
          )
        )}
      </CardContent>
    </Card>
  );
}
