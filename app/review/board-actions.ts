"use server";

import { revalidatePath } from "next/cache";
import { hasRole, requireRole } from "@/lib/auth";
import { assignClaim, logAction, readSubmission } from "@/lib/data";

export type MoveResult = { ok: true } | { ok: false; error: string };

/**
 * Moves a claim on the review board:
 * - "mine": the reviewer takes it (it shows as "In review" with their name), so two people never check the same claim.
 * - "open": they give it back to the shared queue.
 * Admins may move anyone's claim; reviewers only their own.
 */
export async function moveClaimAction(id: string, to: "mine" | "open"): Promise<MoveResult> {
  const user = await requireRole("REVIEWER", "/review?view=board");
  const claim = await readSubmission(id);
  if (!claim) return { ok: false, error: "This claim no longer exists." };
  if (claim.status !== "NEEDS_REVIEW") return { ok: false, error: "Only claims that are waiting for a reviewer can be moved." };

  const takenByOther = claim.assigneeId !== null && claim.assigneeId !== user.id;
  if (takenByOther && !hasRole(user, "ADMIN")) {
    return { ok: false, error: `${claim.assigneeName ?? "Another reviewer"} is already reviewing this claim.` };
  }

  if (to === "mine") {
    if (claim.assigneeId === user.id) return { ok: true };
    await assignClaim(id, user.id);
    await logAction({ actorId: user.id, action: "submission.assigned", submissionId: id, meta: takenByOther ? { from: claim.assigneeName } : undefined });
  } else {
    if (claim.assigneeId === null) return { ok: true };
    await assignClaim(id, null);
    await logAction({ actorId: user.id, action: "submission.released", submissionId: id });
  }

  revalidatePath("/review");
  revalidatePath(`/review/${id}`);
  return { ok: true };
}
