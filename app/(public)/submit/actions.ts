"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hashFile, hashText, normalizeText, normalizeUrl } from "@/lib/content-hash";
import { createSubmission, findPublishedByHash, logAction } from "@/lib/data";
import { domainOf } from "@/lib/format";
import { saveImage } from "@/lib/storage";
import type { NewSubmission } from "@/lib/types";
import { fieldErrors, submissionSchema } from "@/lib/validators";

export type SubmitState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

const shorten = (value: string, max = 90) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

export async function createSubmissionAction(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  // 1. Only signed-in people can submit (simple protection against spam).
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/submit");

  // 2. Validate on the server, even though the browser already checked.
  const values = {
    url: String(formData.get("url") ?? ""),
    text: String(formData.get("text") ?? ""),
    caption: String(formData.get("caption") ?? ""),
  };
  const parsed = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  // 3. Build the record and a fingerprint of the content.
  const input = parsed.data;
  let submission: NewSubmission;

  if (input.type === "URL") {
    const url = normalizeUrl(input.url);
    const domain = domainOf(url) ?? url;
    submission = { type: "URL", url, title: shorten(`Link from ${domain}`), contentHash: hashText(url), userId: user.id };
  } else if (input.type === "TEXT") {
    submission = {
      type: "TEXT",
      text: input.text,
      title: shorten(input.text),
      contentHash: hashText(normalizeText(input.text)),
      userId: user.id,
    };
  } else {
    submission = {
      type: "IMAGE",
      text: input.caption || undefined,
      imagePath: await saveImage(input.image),
      title: input.caption ? shorten(input.caption) : "Uploaded image",
      contentHash: await hashFile(input.image),
      userId: user.id,
    };
  }

  // 4. Already checked? Send them straight to the published result.
  const existing = await findPublishedByHash(submission.contentHash);
  if (existing) redirect(`/s/${existing.id}?notice=existing`);

  const { id } = await createSubmission(submission);
  await logAction({ actorId: user.id, action: "submission.created", submissionId: id, meta: { type: submission.type } });

  // Day 3: send the "submission/created" event to Inngest here to start the pipeline.

  redirect(`/s/${id}?notice=submitted`);
}
