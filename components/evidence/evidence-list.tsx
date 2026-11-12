import { ExternalLink, FileSearch, Globe, ImageIcon, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { domainOf, formatDate } from "@/lib/format";
import { EVIDENCE_KINDS, STANCES } from "@/lib/labels";
import type { Claim, Evidence, EvidenceKind } from "@/lib/types";

/** Evidence is grouped into these sections, in this order. */
export const EVIDENCE_GROUPS: { id: string; title: string; icon: typeof Globe; kinds: EvidenceKind[] }[] = [
  { id: "fact-checks", title: "Existing fact-checks", icon: ShieldCheck, kinds: ["FACT_CHECK"] },
  { id: "sources", title: "Supporting and contradicting sources", icon: Globe, kinds: ["WEB_SOURCE"] },
  { id: "source-info", title: "About the source", icon: Info, kinds: ["SOURCE_INFO"] },
  { id: "image", title: "Image analysis", icon: ImageIcon, kinds: ["IMAGE_MATCH", "IMAGE_METADATA", "OCR_TEXT", "AI_IMAGE_NOTES"] },
];

export function EvidenceList({
  evidence,
  claims,
  kinds,
  showIds = false,
}: {
  evidence: Evidence[];
  claims: Claim[];
  kinds?: EvidenceKind[];
  /** Reviewers see evidence IDs so they can match the AI summary's citations. */
  showIds?: boolean;
}) {
  const items = kinds ? evidence.filter((e) => kinds.includes(e.kind)) : evidence;
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <FileSearch className="size-4" aria-hidden /> Nothing found in this category.
      </p>
    );
  }

  const claimNumber = (claimId: string | null) => {
    const index = claims.findIndex((c) => c.id === claimId);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <EvidenceItem key={item.id} item={item} claimNumber={claimNumber(item.claimId)} showId={showIds} />
      ))}
    </ul>
  );
}

function EvidenceItem({ item, claimNumber, showId }: { item: Evidence; claimNumber: number | null; showId: boolean }) {
  const stance = item.stance ? STANCES[item.stance] : null;
  const isAiNote = item.kind === "AI_IMAGE_NOTES";

  return (
    <li id={`evidence-${item.id}`} className={cn("rounded-lg border bg-card p-4", isAiNote && "border-dashed")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wide">{EVIDENCE_KINDS[item.kind]}</span>
        {claimNumber && <span>Claim {claimNumber}</span>}
        {stance && <span className={cn("font-medium", stance.className)}>{stance.label}</span>}
        {showId && <code className="ml-auto rounded bg-muted px-1.5 py-0.5">{item.id}</code>}
      </div>

      <p className="mt-1.5 font-medium leading-snug">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="inline-flex items-start gap-1 hover:underline"
          >
            {item.title}
            <ExternalLink className="mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden />
          </a>
        ) : (
          item.title
        )}
      </p>

      {item.snippet && <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{item.snippet}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {(item.publisher || item.url) && <span>{item.publisher ?? domainOf(item.url)}</span>}
        {item.publishedAt && <span>· {formatDate(item.publishedAt)}</span>}
        {item.rating && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
            {item.kind === "SOURCE_INFO" ? "Category" : "Rated"}: {item.rating}
          </span>
        )}
      </div>
    </li>
  );
}
