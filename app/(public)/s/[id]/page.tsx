import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, ArrowLeft, Clock, Info, UserCheck } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { ClaimsList } from "@/components/claims-list";
import { T } from "@/components/i18n";
import { EvidenceBoard } from "@/components/evidence/evidence-board";
import { EVIDENCE_GROUPS, EvidenceList } from "@/components/evidence/evidence-list";
import { ForensicsViewer } from "@/components/evidence/forensics-viewer";
import { PipelineMap } from "@/components/pipeline-map";
import { PipelineProgress } from "@/components/pipeline-progress";
import { ShareButtons } from "@/components/share-buttons";
import { DetailSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { SubmittedContent } from "@/components/submitted-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubmission } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { VERDICTS } from "@/lib/labels";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import type { SubmissionDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The page title and link preview show the verdict, e.g. "False: Polling stations will close at 2 PM". */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) return { title: "Result not found" };

  const published = submission.status === "PUBLISHED" && submission.finalVerdict;
  const title = published ? `${VERDICTS[submission.finalVerdict!].label}: ${submission.title}` : submission.title;
  const description = published
    ? (submission.publicNote ?? VERDICTS[submission.finalVerdict!].description)
    : "This claim is being checked. A human reviewer publishes every verdict.";
  return { title, description, openGraph: { title, description, type: "article" }, twitter: { card: "summary_large_image" } };
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
};

export default function ResultPage({ params, searchParams }: Props) {
  return (
    <main className="page-enter mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6">
      <Button variant="outline" size="sm" asChild className="mb-6 h-10 rounded-full px-4">
        <Link href="/verified">
          <ArrowLeft aria-hidden /> <T k="result.back" />
        </Link>
      </Button>
      <Suspense fallback={<DetailSkeleton />}>
        <Result params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Result({ params, searchParams }: Props) {
  const [{ id }, { notice }] = await Promise.all([params, searchParams]);
  const submission = await getSubmission(id);
  if (!submission) notFound();

  const isPublished = submission.status === "PUBLISHED" && submission.finalVerdict;

  return (
    <div className="space-y-6">
      {notice === "submitted" && (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>
            <T k="result.received" />
          </AlertTitle>
          <AlertDescription>
            <T k="result.receivedText" />
          </AlertDescription>
        </Alert>
      )}
      {notice === "reported" && (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>Someone already sent this. Thank you for reporting it too.</AlertTitle>
          <AlertDescription>We’re already checking it. The verdict will appear on this page.</AlertDescription>
        </Alert>
      )}
      {notice === "existing" && (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>This was already checked.</AlertTitle>
          <AlertDescription>Someone sent the same content before, so here is the published result.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={submission.status} />
          {submission.reportCount > 1 && (
            <span className="glass rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-foreground/[0.07]">
              Sent to us {submission.reportCount} times
            </span>
          )}
        </div>
        <h1 className="max-w-5xl text-4xl leading-[1.04] font-bold tracking-tight text-balance md:text-6xl">{submission.title}</h1>
      </div>

      {isPublished ? <VerdictPanel submission={submission} /> : <ProgressPanel submission={submission} />}

      {isPublished && submission.evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evidence map</CardTitle>
            <CardDescription>How each piece of evidence relates to the claims. Click a card to read it.</CardDescription>
          </CardHeader>
          <CardContent>
            <EvidenceBoard title={submission.title} claims={submission.claims} evidence={submission.evidence} />
          </CardContent>
        </Card>
      )}

      {/* min-w-0 lets the columns shrink on phones, so long links get cut off instead of widening the page. */}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px] [&>*]:min-w-0">
        <div className="space-y-6">
          <SubmittedContent submission={submission} />
          {isPublished && submission.imageUrl && <ForensicsViewer imageUrl={submission.imageUrl} evidence={submission.evidence} />}
          {isPublished && <EvidenceSections submission={submission} />}
        </div>
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <T k="result.claims" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClaimsList claims={submission.claims} />
            </CardContent>
          </Card>
          {isPublished && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verification steps</CardTitle>
              </CardHeader>
              <CardContent>
                <PipelineProgress steps={submission.steps} compact />
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function VerdictPanel({ submission }: { submission: SubmissionDetail }) {
  const verdict = submission.finalVerdict!;
  const meta = VERDICTS[verdict];
  const sources = new Set(submission.evidence.map((e) => e.publisher ?? e.url).filter(Boolean)).size;
  const facts = [
    { label: "result.fact.claims", value: submission.claims.length },
    { label: "result.fact.evidence", value: submission.evidence.length },
    { label: "result.fact.sources", value: sources },
    { label: "result.fact.reports", value: submission.reportCount },
  ] as const;
  return (
    <section data-tour="verdict-panel" className="stagger grid gap-4 lg:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
      <div className={cn("sheen relative overflow-hidden rounded-[2.5rem] p-7 md:p-10", meta.tone)}>
        <span aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 size-72 rounded-full bg-current/10" />
        <p className="relative text-xs font-bold tracking-[0.2em] uppercase opacity-70">
          <T k="result.verdict" />
        </p>
        <p className="relative mt-2 text-6xl leading-none font-bold tracking-tight md:text-8xl">
          <T k={`verdict.${verdict}` as MessageKey} />
        </p>
        <p className="relative mt-3 text-base font-semibold opacity-75">{meta.description}</p>
        {submission.publicNote && <p className="relative mt-6 max-w-3xl text-lg leading-relaxed font-medium text-pretty md:text-xl">{submission.publicNote}</p>}
        <p className="relative mt-6 flex items-center gap-2 text-sm font-semibold opacity-75">
          <UserCheck className="size-4" aria-hidden />
          <T k="result.reviewed" /> {formatDate(submission.publishedAt)}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {facts.map((fact, i) => (
            <div key={fact.label} className={cn("rounded-[1.75rem] p-5", i === 0 ? "bg-tint-ink text-tint-ink-foreground" : "glass bg-card ring-1 ring-foreground/[0.07]")}>
              <p className="text-4xl font-bold tracking-tight tabular-nums">{fact.value}</p>
              <p className={cn("mt-1 text-xs font-semibold", i === 0 ? "text-white/60" : "text-muted-foreground")}><T k={fact.label} /></p>
            </div>
          ))}
        </div>
        <div className="glass flex-1 rounded-[1.75rem] bg-card p-5 ring-1 ring-foreground/[0.07]">
          <p className="mb-3 text-sm font-bold">
            <T k="result.share" />
          </p>
          <ShareButtons
            path={`/s/${submission.id}`}
            downloadPath={`/s/${submission.id}/card`}
            text={`Fact-check: “${submission.title}” is rated ${meta.label.toUpperCase()}.`}
          />
        </div>
      </div>
    </section>
  );
}

function ProgressPanel({ submission }: { submission: SubmissionDetail }) {
  const stillRunning = submission.status === "QUEUED" || submission.status === "PROCESSING";

  return (
    <section className="glass relative grid gap-6 overflow-hidden rounded-[2.5rem] bg-card p-6 ring-1 ring-foreground/[0.07] md:grid-cols-[1fr_1.2fr] md:p-9" data-tour="pipeline">
      <div aria-hidden className="orb pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-tint-sky/60 blur-3xl" />
      <div aria-hidden className="orb pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-tint-lime/50 blur-3xl [animation-delay:-8s]" />
      {stillRunning && <AutoRefresh />}
      <PipelineMap steps={submission.steps} className="relative mb-2 md:col-span-2" />
      <div className="relative space-y-3">
        {submission.status === "FAILED" ? (
          <>
            <AlertTriangle className="size-6 text-destructive" aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight">We couldn’t finish checking this</h2>
            <p className="text-sm text-muted-foreground">{submission.error ?? "Something went wrong."}</p>
            <Button variant="outline" asChild>
              <Link href="/submit">Submit it another way</Link>
            </Button>
          </>
        ) : submission.status === "NEEDS_REVIEW" ? (
          <>
            <UserCheck className="size-6 text-amber-600" aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight">
              <T k="result.waiting" />
            </h2>
            <p className="text-sm text-muted-foreground">
              A trained reviewer will read the evidence and publish the verdict here. We never publish an AI verdict
              without a human check.
            </p>
          </>
        ) : (
          <>
            <Clock className="size-6 text-primary" aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight">
              <T k="result.checking" />
            </h2>
            <p className="text-sm text-muted-foreground">
              This usually takes about a minute. The list updates on its own. After that, a human reviewer checks the
              result before it is published.
            </p>
          </>
        )}
      </div>
      <div className="relative">
        <PipelineProgress steps={submission.steps} />
      </div>
    </section>
  );
}

function EvidenceSections({ submission }: { submission: SubmissionDetail }) {
  const groups = EVIDENCE_GROUPS.filter((group) => submission.evidence.some((e) => group.kinds.includes(e.kind)));
  return (
    <>
      {groups.map(({ id, title, icon: Icon, kinds }) => (
        <Card key={id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EvidenceList evidence={submission.evidence} claims={submission.claims} kinds={kinds} />
          </CardContent>
        </Card>
      ))}
    </>
  );
}
