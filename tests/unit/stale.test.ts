import { describe, expect, it } from "vitest";
import { isStale, STALE_AFTER_MS, stoppedSteps } from "@/lib/pipeline/stale";

describe("stale checks", () => {
  const now = Date.now();
  const old = new Date(now - STALE_AFTER_MS - 1000);
  const fresh = new Date(now - 1000);

  it("flags queued or running checks that stopped moving", () => {
    expect(isStale("PROCESSING", old, now)).toBe(true);
    expect(isStale("QUEUED", old, now)).toBe(true);
  });

  it("leaves recent and finished items alone", () => {
    expect(isStale("PROCESSING", fresh, now)).toBe(false);
    expect(isStale("NEEDS_REVIEW", old, now)).toBe(false);
    expect(isStale("PUBLISHED", old, now)).toBe(false);
  });

  it("shows steps that were still running as failed", () => {
    expect(stoppedSteps({ extract: "done", image: "running", sourceInfo: "pending" })).toEqual({ extract: "done", image: "failed", sourceInfo: "failed" });
  });
});
