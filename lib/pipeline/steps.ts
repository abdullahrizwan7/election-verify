import "server-only";
import { aiDescribeImage, aiExtractClaims, aiSynthesize } from "@/lib/ai/tasks";
import { isAiConfigured } from "@/lib/ai/gemini";
import { services } from "@/lib/config";
import {
  findSource,
  getPipelineInput,
  readSources,
  readSubmission,
  replaceClaims,
  replaceEvidence,
  updateSubmission,
} from "@/lib/data";
import {
  ANALYZABLE_TYPES,
  buildMetadataEvidence,
  buildOcrEvidence,
  readMetadata,
  readTextInImage,
} from "@/lib/pipeline/analyze-image";
import { StepError } from "@/lib/pipeline/errors";
import { extractArticle } from "@/lib/pipeline/extract-article";
import { findWebEvidence } from "@/lib/pipeline/find-web-evidence";
import { extractClaimsHeuristic, ruleBasedSuggestion } from "@/lib/pipeline/rules";
import { searchFactChecks } from "@/lib/pipeline/search-factchecks";
import {
  buildSourceEvidence,
  candidateDomains,
  lookupRegistrationDate,
  registrableDomain,
} from "@/lib/pipeline/source-reputation";
import { loadImage } from "@/lib/storage";
import type { NewEvidence, PipelineStepKey } from "@/lib/types";

/**
 * The verification pipeline, one step per entry, in the order they run.
 * Every step loads what it needs from the database and saves its results,
 * so a step can be retried on its own (that is how Inngest runs them).
 *
 * `required` steps stop the pipeline when they fail. Optional ones are marked
 * "failed" and the pipeline carries on with the evidence it has.
 */
export type StepOutcome = "done" | "skipped";

export interface PipelineStep {
  key: PipelineStepKey;
  required: boolean;
  run(submissionId: string): Promise<StepOutcome>;
}

async function load(id: string) {
  const input = await getPipelineInput(id);
  if (!input) throw new StepError("This submission no longer exists.");
  return input;
}

export const PIPELINE: PipelineStep[] = [
  {
    key: "extract",
    required: true,
    async run(id) {
      const input = await load(id);
      if (input.type !== "URL" || !input.url) return "done"; // text and images are already here
      const article = await extractArticle(input.url);
      await updateSubmission(id, { title: article.title?.slice(0, 200) || input.title, text: article.text });
      return "done";
    },
  },

  {
    key: "sourceInfo",
    required: false,
    async run(id) {
      const input = await load(id);
      if (!input.url) return "skipped";
      const url = new URL(input.url);

      let source = null;
      for (const domain of candidateDomains(url.hostname)) {
        source = await findSource(domain);
        if (source) break;
      }
      const registered = await lookupRegistrationDate(registrableDomain(url.hostname));
      await replaceEvidence(id, ["SOURCE_INFO"], [buildSourceEvidence({ url, source, registered })]);
      return "done";
    },
  },

  {
    key: "image",
    required: false,
    async run(id) {
      const input = await load(id);
      if (input.type !== "IMAGE" || !input.imagePath) return "skipped";
      const image = await loadImage(input.imagePath);
      if (!image) throw new StepError("The image could not be loaded.");
      if (!ANALYZABLE_TYPES.includes(image.mimeType)) return "skipped";

      const items: NewEvidence[] = [buildMetadataEvidence(await readMetadata(image.bytes))];
      const text = await readTextInImage(image.bytes).catch((error) => {
        console.error("[pipeline] OCR failed", error);
        return "";
      });
      items.push(buildOcrEvidence(text));

      if (isAiConfigured()) {
        const notes = await aiDescribeImage(image, input.text).catch(() => "");
        if (notes) {
          items.push({
            claimId: null,
            kind: "AI_IMAGE_NOTES",
            title: "AI observations (not proof)",
            url: null,
            publisher: null,
            rating: null,
            stance: null,
            snippet: notes,
            publishedAt: null,
          });
        }
      }

      await replaceEvidence(id, ["IMAGE_METADATA", "OCR_TEXT", "AI_IMAGE_NOTES"], items);
      return "done";
    },
  },

  {
    key: "claims",
    required: true,
    async run(id) {
      const submission = await readSubmission(id);
      if (!submission) throw new StepError("This submission no longer exists.");
      const ocr = submission.evidence.find((e) => e.kind === "OCR_TEXT" && e.title === "Text found in the image")?.snippet;
      const text = [submission.text, ocr].filter(Boolean).join("\n\n").trim();
      if (!text) {
        await replaceClaims(id, []);
        return "done"; // an image with no caption and no text: the reviewer looks at the image itself
      }

      let claims = isAiConfigured() ? await aiExtractClaims(text).catch(() => []) : [];
      if (claims.length === 0) claims = extractClaimsHeuristic(text);
      await replaceClaims(id, claims);
      return "done";
    },
  },

  {
    key: "factCheck",
    required: false,
    async run(id) {
      if (!services.factCheck.apiKey) return "skipped";
      const submission = await readSubmission(id);
      if (!submission?.claims.length) return "skipped";
      await replaceEvidence(id, ["FACT_CHECK"], await searchFactChecks(submission.claims));
      return "done";
    },
  },

  {
    key: "webEvidence",
    required: false,
    async run(id) {
      if (!services.tavily.apiKey) return "skipped";
      const submission = await readSubmission(id);
      if (!submission?.claims.length) return "skipped";
      await replaceEvidence(id, ["WEB_SOURCE"], await findWebEvidence(submission.claims, await readSources()));
      return "done";
    },
  },

  {
    key: "synthesize",
    required: true,
    async run(id) {
      const submission = await readSubmission(id);
      if (!submission) throw new StepError("This submission no longer exists.");

      let suggestion = null;
      if (isAiConfigured()) {
        suggestion = await aiSynthesize({
          text: submission.text ?? submission.title,
          claims: submission.claims,
          evidence: submission.evidence,
        }).catch((error) => {
          console.error("[pipeline] AI summary failed, using rules instead", error);
          return null;
        });
      }
      suggestion ??= ruleBasedSuggestion(submission.evidence);

      await updateSubmission(id, {
        aiVerdict: suggestion.verdict,
        aiConfidence: suggestion.confidence,
        aiSummary: suggestion.summary,
      });
      return "done";
    },
  },
];
