import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, RotateCcw } from "lucide-react";
import { rerunPipelineAction } from "@/app/review/[id]/actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { ClaimsList } from "@/components/claims-list";
import { AddEvidenceForm } from "@/components/review/add-evidence-form";
import { ReverseImageSearch } from "@/components/review/reverse-image-search";
import { EvidenceBoard } from "@/components/evidence/evidence-board";
import { EVIDENCE_GROUPS, EvidenceList } from "@/components/evidence/evidence-list";
import { ForensicsViewer } from "@/components/evidence/forensics-viewer";
import { PipelineMap } from "@/components/pipeline-map";
import { PipelineProgress } from "@/components/pipeline-progress";
import { AiSuggestion } from "@/components/review/ai-suggestion";
import { VerdictForm } from "@/components/review/verdict-form";
import { DetailSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { SubmittedContent } from "@/components/submitted-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerdictBadge } from "@/components/verdict-badge";
import { requireRole } from "@/lib/auth";
import { getSubmission } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Review submission" };

type Params = Promise<{ id: string }>;

export default function ReviewSubmissionPage({ params }: { params: Params }) {
  return (
    <main className="page-enter mx-auto max-w-7xl px-4 py-8">
      <Button variant="outline" size="sm" asChild className="mb-6 h-10 rounded-full px-4">
        <Link href="/review">
          <ArrowLeft aria-hidden /> Back to queue
        </Link>
      </Button>
      <Suspense fallback={<DetailSkeleton />}>
        <Workspace params={params} />
      </Suspense>
    </main>
  );
}

async function Workspace({ params }: { params: Params }) {
  const { id } = await params;
  await requireRole("REVIEWER", `/review/${id}`);
  const submission = await getSubmission(id);
  if (!submission) notFound();

  const ready = submission.status === "NEEDS_REVIEW" || submission.status === "PUBLISHED";
  const running = submission.status === "QUEUED" || submission.status === "PROCESSING";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <StatusBadge status={submission.status} />
          <h1 className="max-w-4xl text-3xl leading-[1.05] font-bold tracking-tight text-balance md:text-5xl">{submission.title}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted {formatDateTime(submission.createdAt)}
            {submission.reportCount > 1 && ` · sent to us ${submission.reportCount} times`}
          </p>
        </div>
        {submission.status === "PUBLISHED" && (
          <Button variant="outline" asChild>
            <Link href={`/s/${submission.id}`}>
              View public page <ExternalLink aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      {submission.evidence.length > 0 && (
        <Card data-tour="evidence-board">
          <CardHeader>
            <CardTitle className="text-base">Evidence board</CardTitle>
            <CardDescription>Drag to rearrange, scroll to zoom, click a card to jump to it.</CardDescription>
          </CardHeader>
          <CardContent>
            <EvidenceBoard title={submission.title} claims={submission.claims} evidence={submission.evidence} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: the content and all evidence */}
        <div className="space-y-6">
          <Card className="hidden md:flex">
            <CardContent>
              <PipelineMap steps={submission.steps} />
            </CardContent>
          </Card>
          <SubmittedContent submission={submission} />
          {submission.imageUrl && <ForensicsViewer imageUrl={submission.imageUrl} evidence={submission.evidence} />}
          {submission.imageUrl && <ReverseImageSearch imageUrl={submission.imageUrl} />}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Claims found</CardTitle>
            </CardHeader>
            <CardContent>
              <ClaimsList claims={submission.claims} />
            </CardContent>
          </Card>


          {EVIDENCE_GROUPS.map(({ id: groupId, title, icon: Icon, kinds }) => (
            <Card key={groupId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EvidenceList evidence={submission.evidence} claims={submission.claims} kinds={kinds} showIds />
              </CardContent>
            </Card>
          ))}

          {submission.status !== "QUEUED" && submission.status !== "PROCESSING" && (
            <AddEvidenceForm submissionId={submission.id} claims={submission.claims} />
          )}
        </div>

        {/* Right: AI suggestion and the decision form stay in view */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <AiSuggestion submission={submission} />
          <VerdictForm
            submissionId={submission.id}
            suggested={submission.aiVerdict}
            current={submission.finalVerdict}
            currentNote={submission.publicNote}
            disabled={!ready}
          />
          {submission.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.reviews.map((review) => (
                  <div key={review.id} className="space-y-1 rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <VerdictBadge verdict={review.verdict} />
                      <span className="text-xs text-muted-foreground">{formatDateTime(review.createdAt)}</span>
                    </div>
                    <p className="text-muted-foreground">by {review.reviewerName}</p>
                    {review.internalNote && <p className="italic">“{review.internalNote}”</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {running && <AutoRefresh />}
              <PipelineProgress steps={submission.steps} compact />
              {submission.error && <p className="text-sm text-destructive">{submission.error}</p>}
              <p className="text-xs text-muted-foreground">
                A skipped step didn’t apply to this item, or its free API key isn’t connected yet. See{" "}
                <Link href="/admin/setup" className="underline">
                  Setup
                </Link>
                .
              </p>
              {(submission.status === "FAILED" || submission.status === "NEEDS_REVIEW") && (
                <form action={rerunPipelineAction}>
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <Button type="submit" variant="outline" size="sm" className="w-full">
                    <RotateCcw aria-hidden /> Run the checks again
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
