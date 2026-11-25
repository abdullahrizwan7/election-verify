"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SUBMISSIONS_PER_HOUR } from "@/lib/config";
import { hashFile, hashText, normalizeText, normalizeUrl } from "@/lib/content-hash";
import {
  addReport,
  countSubmissionsSince,
  createSubmission,
  findOpenByHash,
  findPublishedByHash,
  logAction,
} from "@/lib/data";
import { domainOf } from "@/lib/format";
import { imageFingerprint } from "@/lib/pipeline/image-hash";
import { startPipeline } from "@/lib/pipeline/run";
import { saveImage } from "@/lib/storage";
import type { NewSubmission } from "@/lib/types";
import { fieldErrors, submissionSchema } from "@/lib/validators";

export type SubmitState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

const shorten = (value: string, max = 90) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

/**
 * Receives a claim from the submit form. Unexpected failures are recorded in the activity
 * log (with the real error, so they can be diagnosed) and shown as a clear message on the
 * form instead of an error page.
 */
export async function createSubmissionAction(prev: SubmitState, formData: FormData): Promise<SubmitState> {
  try {
    return await submitClaim(prev, formData);
  } catch (error) {
    unstable_rethrow(error); // redirects to the result page are not errors
    const ref = crypto.randomUUID().slice(0, 8);
    const image = formData.get("image");
    const detail = {
      ref,
      type: String(formData.get("type") ?? ""),
      message: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300),
      where: error instanceof Error ? (error.stack ?? "").split("\n").slice(1, 4).join(" | ").slice(0, 300) : "",
      image: image instanceof File ? `${image.type} ${Math.round(image.size / 1024)} KB` : null,
    };
    console.error("Submitting a claim failed", detail, error);
    await logAction({ actorId: null, action: "submission.failed", meta: detail }).catch(() => {});
    return {
      errors: { form: `Something went wrong while sending this (reference ${ref}). Please try again in a moment.` },
      values: {
        url: String(formData.get("url") ?? ""),
        text: String(formData.get("text") ?? ""),
        caption: String(formData.get("caption") ?? ""),
      },
    };
  }
}

async function submitClaim(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  // 1. Only signed-in people can submit (simple protection against spam).
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/submit");

  const values = {
    url: String(formData.get("url") ?? ""),
    text: String(formData.get("text") ?? ""),
    caption: String(formData.get("caption") ?? ""),
  };

  // 2. Limit how much one person can send, so nobody can flood the reviewers.
  if (user.role === "USER") {
    const lastHour = await countSubmissionsSince(user.id, new Date(Date.now() - 60 * 60 * 1000));
    if (lastHour >= SUBMISSIONS_PER_HOUR) {
      return {
        errors: { form: `You've sent ${SUBMISSIONS_PER_HOUR} items in the last hour. Please wait a little and try again.` },
        values,
      };
    }
  }

  // 3. Validate on the server, even though the browser already checked.
  const parsed = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  // 4. Build the record and a fingerprint of the content.
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
      title: input.caption ? shorten(input.caption) : "Uploaded image",
      contentHash: await hashFile(input.image),
      // A fingerprint of how the picture looks, to find resized copies later.
      imageHash: (await imageFingerprint(Buffer.from(await input.image.arrayBuffer()))) ?? undefined,
      userId: user.id,
    };
  }

  // 5. Already checked? Send them straight to the published result.
  const published = await findPublishedByHash(submission.contentHash);
  if (published) redirect(`/s/${published.id}?notice=existing`);

  // Still being checked? Count the extra report instead of checking it twice.
  const open = await findOpenByHash(submission.contentHash);
  if (open) {
    await addReport(open.id);
    await logAction({ actorId: user.id, action: "submission.reported_again", submissionId: open.id });
    redirect(`/s/${open.id}?notice=reported`);
  }

  // Only store the image once we know it's new.
  if (input.type === "IMAGE") {
    try {
      submission.imagePath = await saveImage(input.image);
    } catch (error) {
      console.error("Image upload to storage failed", error);
      return { errors: { image: "We couldn't save your image. Please try again in a moment." }, values };
    }
  }

  // 6. Save it, start the checks in the background, and show the progress page.
  const { id } = await createSubmission(submission);
  await logAction({ actorId: user.id, action: "submission.created", submissionId: id, meta: { type: submission.type } });
  await startPipeline(id);

  redirect(`/s/${id}?notice=submitted`);
}
