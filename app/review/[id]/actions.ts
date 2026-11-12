"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSubmission, logAction, publishReview } from "@/lib/data";
import type { Verdict } from "@/lib/types";
import { fieldErrors, reviewSchema } from "@/lib/validators";

export type ReviewState = { errors?: Record<string, string> };

export async function publishReviewAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  // Check the role again here. Hiding the form is not enough protection.
  const submissionId = String(formData.get("submissionId") ?? "");
  const reviewer = await requireRole("REVIEWER", `/review/${submissionId}`);

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const submission = await getSubmission(parsed.data.submissionId);
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
