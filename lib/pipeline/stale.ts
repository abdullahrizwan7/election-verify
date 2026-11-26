import type { PipelineSteps, Status } from "@/lib/types";

/** A check that hasn't moved for this long has stopped (for example the server timed out). */
export const STALE_AFTER_MS = 10 * 60 * 1000;

export const STALE_MESSAGE = "Checking took too long and stopped. A reviewer can run it again.";

/** True when a queued or running check hasn't changed for STALE_AFTER_MS. */
export function isStale(status: Status, updatedAt: Date, now?: number): boolean {
  if (status !== "QUEUED" && status !== "PROCESSING") return false;
  return (now ?? Date.now()) - updatedAt.getTime() > STALE_AFTER_MS;
}

/** Steps that were still running when the check stopped are shown as failed. */
export function stoppedSteps(steps: PipelineSteps): PipelineSteps {
  return Object.fromEntries(
    Object.entries(steps).map(([key, state]) => [key, state === "running" || state === "pending" ? "failed" : state]),
  ) as PipelineSteps;
}
