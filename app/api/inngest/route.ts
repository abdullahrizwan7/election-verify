import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { verifySubmission } from "@/inngest/verify-submission";

// Inngest calls this endpoint to run each step of the pipeline.
export const { GET, POST, PUT } = serve({ client: inngest, functions: [verifySubmission] });
