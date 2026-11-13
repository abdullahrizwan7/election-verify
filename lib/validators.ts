import { z } from "zod";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/config";
import { VERDICT_ORDER } from "@/lib/labels";

/**
 * Validation rules for every form. The same schemas run on the server inside
 * Server Actions, so nobody can skip them by editing the page in the browser.
 */

const optionalText = (max: number) =>
  z.string().trim().max(max, { error: `Keep this under ${max} characters.` }).optional();

export const linkSubmissionSchema = z.object({
  type: z.literal("URL"),
  url: z.httpUrl({ error: "Enter a full link that starts with http:// or https://" }),
  note: optionalText(500),
});

export const textSubmissionSchema = z.object({
  type: z.literal("TEXT"),
  text: z
    .string()
    .trim()
    .min(20, { error: "Paste at least 20 characters so there is something to check." })
    .max(5000, { error: "Keep the text under 5,000 characters." }),
});

export const imageSubmissionSchema = z.object({
  type: z.literal("IMAGE"),
  image: z
    .instanceof(File, { error: "Choose an image to upload." })
    .refine((file) => file.size > 0, { error: "Choose an image to upload." })
    .refine((file) => file.size <= MAX_IMAGE_BYTES, { error: "The image must be 5 MB or smaller." })
    .refine((file) => ALLOWED_IMAGE_TYPES.includes(file.type), { error: "Use a JPG, PNG or WebP image." }),
  caption: optionalText(500),
});

export const submissionSchema = z.discriminatedUnion("type", [
  linkSubmissionSchema,
  textSubmissionSchema,
  imageSubmissionSchema,
]);

export type SubmissionInput = z.infer<typeof submissionSchema>;

export const reviewSchema = z.object({
  submissionId: z.string().min(1),
  verdict: z.enum(VERDICT_ORDER as [string, ...string[]], { error: "Choose a verdict." }),
  publicNote: z
    .string()
    .trim()
    .min(20, { error: "Explain the verdict in at least 20 characters. The public will read this." })
    .max(1000, { error: "Keep the explanation under 1,000 characters." }),
  internalNote: optionalText(2000),
});

/** Evidence a reviewer found by hand (a link, a phone call to an official, a document). */
export const manualEvidenceSchema = z.object({
  submissionId: z.string().min(1),
  title: z.string().trim().min(5, { error: "Describe the evidence in a few words." }).max(200),
  url: z.union([z.literal(""), z.httpUrl({ error: "Enter a full link that starts with http:// or https://" })]).optional(),
  note: optionalText(1000),
  stance: z.enum(["SUPPORTS", "REFUTES", "NEUTRAL"], { error: "Choose whether it supports or contradicts the claim." }),
  claimId: z.string().optional(),
});

export const sourceSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, { error: "Enter a domain like example.com (no https://)." }),
  name: z.string().trim().min(2, { error: "Enter the source's name." }).max(120),
  type: z.enum(["OFFICIAL", "NEWS", "FACT_CHECKER", "SATIRE", "KNOWN_MISINFO"], { error: "Choose a type." }),
  trust: z.coerce.number().int().min(0).max(100),
  notes: optionalText(500),
});

/** Turns zod issues into `{ fieldName: "first error message" }` for the form. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
