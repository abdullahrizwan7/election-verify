"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import {
  addEvidence,
  logAction,
  publishReview,
  readSubmission,
  replaceClaims,
  replaceEvidence,
  updateSubmission,
} from "@/lib/data";
import { domainOf } from "@/lib/format";
import { EVIDENCE_KINDS } from "@/lib/labels";
import { startPipeline } from "@/lib/pipeline/run";
import type { EvidenceKind, Verdict } from "@/lib/types";
import { fieldErrors, manualEvidenceSchema, reviewSchema } from "@/lib/validators";

export type ReviewState = { errors?: Record<string, string> };

export async function publishReviewAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  // Check the role again here. Hiding the form is not enough protection.
  const submissionId = String(formData.get("submissionId") ?? "");
  const reviewer = await requireRole("REVIEWER", `/review/${submissionId}`);

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const submission = await readSubmission(parsed.data.submissionId);
  if (!submission) return { errors: { form: "This submission no longer exists." } };
  if (submission.status !== "NEEDS_REVIEW" && submission.status !== "PUBLISHED") {
    return { errors: { form: "The evidence isn't ready yet. Wait until the analysis finishes." } };
  }

  await publishReview({
    submissionId: submission.id,
    reviewerId: reviewer.id,
    verdict: parsed.data.verdict as Verdict,
    publicNote: parsed.data.publicNote,
    internalNote: parsed.data.internalNote || undefined,
  });
  await logAction({
    actorId: reviewer.id,
    action: "review.published",
    submissionId: submission.id,
    meta: { verdict: parsed.data.verdict, aiVerdict: submission.aiVerdict },
  });

  redirect("/review?notice=published");
}

/** Clears the old results and runs the whole check again (for failed or unclear items). */
export async function rerunPipelineAction(formData: FormData): Promise<void> {
  const submissionId = String(formData.get("submissionId") ?? "");
  const reviewer = await requireRole("REVIEWER", `/review/${submissionId}`);

  const submission = await readSubmission(submissionId);
  // Published items keep their verdict, and running items are left alone.
  if (!submission || (submission.status !== "FAILED" && submission.status !== "NEEDS_REVIEW")) {
    redirect(`/review/${submissionId}`);
  }

  await replaceClaims(submissionId, []);
  await replaceEvidence(submissionId, Object.keys(EVIDENCE_KINDS) as EvidenceKind[], []);
  await updateSubmission(submissionId, {
    status: "QUEUED",
    steps: {},
    error: null,
    aiVerdict: null,
    aiConfidence: null,
    aiSummary: null,
  });
  await logAction({ actorId: reviewer.id, action: "pipeline.rerun", submissionId });
  await startPipeline(submissionId);

  redirect(`/review/${submissionId}`);
}

export type EvidenceState = { errors?: Record<string, string>; saved?: boolean };

/** A reviewer adds evidence they found themselves. It is labelled as added by a reviewer. */
export async function addEvidenceAction(_prev: EvidenceState, formData: FormData): Promise<EvidenceState> {
  const submissionId = String(formData.get("submissionId") ?? "");
  const reviewer = await requireRole("REVIEWER", `/review/${submissionId}`);

  const parsed = manualEvidenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const submission = await readSubmission(submissionId);
  if (!submission) return { errors: { form: "This submission no longer exists." } };
  const claimId = submission.claims.some((c) => c.id === parsed.data.claimId) ? parsed.data.claimId! : null;
  const url = parsed.data.url || null;

  await addEvidence(submissionId, {
    claimId,
    kind: "MANUAL",
    title: parsed.data.title,
    url,
    publisher: `${domainOf(url) ?? "Reviewer note"} · added by ${reviewer.name ?? reviewer.email}`,
    rating: null,
    stance: parsed.data.stance,
    snippet: parsed.data.note || null,
    publishedAt: null,
  });
  await logAction({ actorId: reviewer.id, action: "evidence.added", submissionId, meta: { stance: parsed.data.stance } });

  revalidatePath(`/review/${submissionId}`);
  return { saved: true };
}
