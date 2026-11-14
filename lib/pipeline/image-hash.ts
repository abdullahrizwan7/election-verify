import sharp from "sharp";
import { formatDate } from "@/lib/format";
import { VERDICTS } from "@/lib/labels";
import type { ImageFingerprint, NewEvidence } from "@/lib/types";

/**
 * A "perceptual hash" (dHash) is a fingerprint of what an image looks like.
 * Unlike a normal file hash, it stays almost the same when a photo is resized,
 * re-compressed by WhatsApp, or saved as a different file type. That lets us
 * spot the same picture being sent again with a new caption.
 *
 * How it works: shrink the image to 9×8 grey pixels, then for each row record
 * whether each pixel is brighter than the one to its right. That gives 64 bits,
 * written as 16 hex characters.
 */
export async function imageFingerprint(bytes: Buffer): Promise<string | null> {
  try {
    const pixels = await sharp(bytes).rotate().grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
    let hex = "";
    for (let row = 0; row < 8; row++) {
      let byte = 0;
      for (let col = 0; col < 8; col++) {
        byte = (byte << 1) | (pixels[row * 9 + col] > pixels[row * 9 + col + 1] ? 1 : 0);
      }
      hex += byte.toString(16).padStart(2, "0");
    }
    return hex;
  } catch {
    return null; // not an image sharp can read
  }
}

/** How many of the 64 bits differ. 0 = identical, under ~6 = almost certainly the same picture. */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== 16 || b.length !== 16) return 64;
  let distance = 0;
  for (let i = 0; i < 16; i += 2) {
    let diff = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    while (diff) {
      distance += diff & 1;
      diff >>= 1;
    }
  }
  return distance;
}

export const SIMILAR_IMAGE_MAX_DISTANCE = 6;

export function findSimilarImages(hash: string, candidates: ImageFingerprint[], max = 3) {
  return candidates
    .map((candidate) => ({ ...candidate, distance: hammingDistance(hash, candidate.imageHash) }))
    .filter((c) => c.distance <= SIMILAR_IMAGE_MAX_DISTANCE)
    .sort((a, b) => a.distance - b.distance || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, max);
}

export function buildSimilarImageEvidence(matches: ReturnType<typeof findSimilarImages>): NewEvidence[] {
  return matches.map((match) => {
    const similarity = Math.round((1 - match.distance / 64) * 100);
    const verdict = match.finalVerdict ? `Published verdict: ${VERDICTS[match.finalVerdict].label}` : "Not published yet";
    return {
      claimId: null,
      kind: "IMAGE_MATCH",
      title: `The same image was sent to us before: “${match.title}”`,
      url: match.status === "PUBLISHED" ? `/s/${match.id}` : `/review/${match.id}`,
      publisher: "ElectionVerify",
      rating: null,
      stance: "NEUTRAL",
      snippet: `${similarity}% similar · sent on ${formatDate(match.createdAt)} · ${verdict}. Check whether the caption makes the same claim.`,
      publishedAt: null,
      data: { compareSubmissionId: match.id, compareLabel: `Sent on ${formatDate(match.createdAt)}` },
    };
  });
}
