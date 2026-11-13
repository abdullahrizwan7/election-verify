import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, ArrowLeft, Clock, Info, UserCheck } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { ClaimsList } from "@/components/claims-list";
import { EVIDENCE_GROUPS, EvidenceList } from "@/components/evidence/evidence-list";
import { PipelineProgress } from "@/components/pipeline-progress";
import { ShareButtons } from "@/components/share-buttons";
import { DetailSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { SubmittedContent } from "@/components/submitted-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerdictBadge } from "@/components/verdict-badge";
import { getSubmission } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { VERDICTS } from "@/lib/labels";
import type { SubmissionDetail } from "@/lib/types";

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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/verified">
          <ArrowLeft aria-hidden /> All verified claims
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
          <AlertTitle>Thanks, we received it.</AlertTitle>
          <AlertDescription>Keep this page open or bookmark it. It updates as each step finishes.</AlertDescription>
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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={submission.status} />
          {submission.reportCount > 1 && (
            <span className="text-xs text-muted-foreground">Sent to us {submission.reportCount} times</span>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-pretty md:text-3xl">{submission.title}</h1>
      </div>

      {isPublished ? <VerdictPanel submission={submission} /> : <ProgressPanel submission={submission} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SubmittedContent submission={submission} />
          {isPublished && <EvidenceSections submission={submission} />}
        </div>
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Claims we checked</CardTitle>
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
  const rgb = VERDICTS[verdict].rgb;
  return (
    <section
      className="relative overflow-hidden rounded-2xl border bg-card p-6 backdrop-blur-xl"
      style={{ boxShadow: `0 0 0 1px rgb(${rgb} / 0.35), 0 30px 80px -30px rgb(${rgb} / 0.7)` }}
    >
      {/* Verdict-colored light along the top and in the corner */}
      <div aria-hidden className="absolute inset-x-8 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, rgb(${rgb}), transparent)` }} />
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full blur-3xl" style={{ background: `rgb(${rgb} / 0.18)` }} />
      <div className="relative flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={verdict} size="lg" />
        <span className="text-sm text-muted-foreground">{VERDICTS[verdict].description}</span>
      </div>
      {submission.publicNote && <p className="relative mt-4 max-w-3xl text-lg leading-relaxed text-pretty">{submission.publicNote}</p>}
      <p className="relative mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <UserCheck className="size-4" aria-hidden />
        Reviewed by a human on {formatDate(submission.publishedAt)}
      </p>
      <div className="relative mt-5 border-t pt-4">
        <ShareButtons
          path={`/s/${submission.id}`}
          text={`Fact-check: “${submission.title}” is rated ${VERDICTS[verdict].label.toUpperCase()}.`}
        />
      </div>
    </section>
  );
}

function ProgressPanel({ submission }: { submission: SubmissionDetail }) {
  const stillRunning = submission.status === "QUEUED" || submission.status === "PROCESSING";

  return (
    <section className="border-gradient relative grid gap-6 overflow-hidden rounded-2xl p-6 md:grid-cols-[1fr_1.2fr]">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-glow/15 blur-3xl" />
      {stillRunning && <AutoRefresh />}
      <div className="relative space-y-3">
        {submission.status === "FAILED" ? (
          <>
            <AlertTriangle className="size-6 text-destructive" aria-hidden />
            <h2 className="text-lg font-medium">We couldn’t finish checking this</h2>
            <p className="text-sm text-muted-foreground">{submission.error ?? "Something went wrong."}</p>
            <Button variant="outline" asChild>
              <Link href="/submit">Submit it another way</Link>
            </Button>
          </>
        ) : submission.status === "NEEDS_REVIEW" ? (
          <>
            <UserCheck className="size-6 text-amber-600" aria-hidden />
            <h2 className="text-lg font-medium">Evidence collected, waiting for a reviewer</h2>
            <p className="text-sm text-muted-foreground">
              A trained reviewer will read the evidence and publish the verdict here. We never publish an AI verdict
              without a human check.
            </p>
          </>
        ) : (
          <>
            <Clock className="size-6 text-primary" aria-hidden />
            <h2 className="text-lg font-medium">We’re checking this now</h2>
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
