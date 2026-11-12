import "server-only";
import { after } from "next/server";
import { demoStepDelayMs, services } from "@/lib/config";
import { getPipelineInput, updateSubmission } from "@/lib/data";
import { StepError } from "@/lib/pipeline/errors";
import { PIPELINE, type PipelineStep } from "@/lib/pipeline/steps";
import type { PipelineStepKey, PipelineSteps, StepState } from "@/lib/types";

/**
 * Starts checking a submission in the background.
 * - With Inngest configured: sends an event, and Inngest runs each step with retries.
 * - Without it: runs right after the response is sent, inside the web server.
 *   Good for development and demos. On a free Vercel plan long runs may be cut off,
 *   so use Inngest in production.
 */
export async function startPipeline(submissionId: string): Promise<void> {
  if (services.inngest.enabled) {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({ name: "submission/created", data: { submissionId } });
    return;
  }
  after(() => runPipeline(submissionId).catch((error) => console.error("[pipeline] crashed", error)));
}

/** Runs every step in order. Used directly in demo mode. */
export async function runPipeline(submissionId: string): Promise<void> {
  await markStarted(submissionId);
  for (const step of PIPELINE) {
    const keepGoing = await runStep(submissionId, step);
    if (!keepGoing) return;
  }
  await markReady(submissionId);
}

export async function markStarted(submissionId: string): Promise<void> {
  const steps = Object.fromEntries(PIPELINE.map((s) => [s.key, "pending"])) as PipelineSteps;
  await updateSubmission(submissionId, { status: "PROCESSING", error: null, steps });
}

export async function markReady(submissionId: string): Promise<void> {
  await updateSubmission(submissionId, { status: "NEEDS_REVIEW" });
}

/** Runs one step and records its state. Returns false when the pipeline must stop. */
export async function runStep(submissionId: string, step: PipelineStep): Promise<boolean> {
  await setStepState(submissionId, step.key, "running");
  if (demoStepDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, demoStepDelayMs));

  try {
    const outcome = await step.run(submissionId);
    await setStepState(submissionId, step.key, outcome);
    return true;
  } catch (error) {
    console.error(`[pipeline] step "${step.key}" failed for ${submissionId}`, error);
    await setStepState(submissionId, step.key, "failed");
    if (!step.required) return true;

    const message = error instanceof StepError ? error.userMessage : "Something went wrong while checking this. A reviewer can try again.";
    await updateSubmission(submissionId, { status: "FAILED", error: message });
    return false;
  }
}

async function setStepState(submissionId: string, key: PipelineStepKey, state: StepState): Promise<void> {
  const input = await getPipelineInput(submissionId);
  if (!input) return;
  await updateSubmission(submissionId, { steps: { ...input.steps, [key]: state } });
}
