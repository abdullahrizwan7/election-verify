import { inngest } from "@/inngest/client";
import { markReady, markStarted, runStep } from "@/lib/pipeline/run";
import { PIPELINE } from "@/lib/pipeline/steps";

/**
 * The same pipeline as lib/pipeline/run.ts, but each step is a separate
 * Inngest step. If the server restarts halfway, Inngest continues from the
 * last finished step instead of starting over.
 */
export const verifySubmission = inngest.createFunction(
  { id: "verify-submission", triggers: [{ event: "submission/created" }], retries: 2 },
  async ({ event, step }) => {
    const submissionId = String((event.data as { submissionId?: string }).submissionId);

    await step.run("start", () => markStarted(submissionId));
    for (const pipelineStep of PIPELINE) {
      const keepGoing = await step.run(pipelineStep.key, () => runStep(submissionId, pipelineStep));
      if (!keepGoing) return { submissionId, status: "FAILED" };
    }
    await step.run("finish", () => markReady(submissionId));
    return { submissionId, status: "NEEDS_REVIEW" };
  },
);
