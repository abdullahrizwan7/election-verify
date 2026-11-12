import { Inngest } from "inngest";

/**
 * Inngest runs the verification pipeline as a background job with automatic
 * retries. Locally, start the free dev server with `npx inngest-cli@latest dev`
 * and set INNGEST_DEV=1 in .env. In production, add INNGEST_EVENT_KEY and
 * INNGEST_SIGNING_KEY from the Inngest dashboard (free plan).
 */
export const inngest = new Inngest({ id: "election-verify" });
