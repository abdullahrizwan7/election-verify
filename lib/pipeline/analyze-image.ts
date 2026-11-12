import { tmpdir } from "node:os";
import { join } from "node:path";
import exifr from "exifr";
import { formatDateTime } from "@/lib/format";
import type { NewEvidence } from "@/lib/types";

/**
 * Free image checks that run on our own server:
 * 1. Metadata (EXIF): camera, date taken, editing software, GPS.
 * 2. OCR: reads any text in the image (signs, captions, watermarks, screenshots).
 */

export const ANALYZABLE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ImageMetadata {
  camera: string | null;
  takenAt: Date | null;
  software: string | null;
  hasGps: boolean;
}

export async function readMetadata(bytes: Buffer): Promise<ImageMetadata | null> {
  try {
    const data = await exifr.parse(bytes, { tiff: true, exif: true, gps: true, xmp: false, icc: false });
    if (!data) return null;
    const camera = [data.Make, data.Model].filter(Boolean).join(" ").trim() || null;
    const taken = data.DateTimeOriginal ?? data.CreateDate ?? null;
    return {
      camera,
      takenAt: taken instanceof Date && !Number.isNaN(taken.getTime()) ? taken : null,
      software: typeof data.Software === "string" ? data.Software.trim() : null,
      hasGps: typeof data.latitude === "number" && typeof data.longitude === "number",
    };
  } catch {
    return null;
  }
}

export function buildMetadataEvidence(meta: ImageMetadata | null): NewEvidence {
  const base = { claimId: null, kind: "IMAGE_METADATA" as const, url: null, publisher: null, rating: null, stance: null, publishedAt: null };

  if (!meta || (!meta.camera && !meta.takenAt && !meta.software && !meta.hasGps)) {
    return {
      ...base,
      title: "No camera metadata",
      snippet: "The camera details and date were removed. Social media apps usually do this, so it proves nothing on its own.",
    };
  }

  const facts = [
    meta.takenAt && `Date taken: ${formatDateTime(meta.takenAt)}`,
    meta.camera && `Camera: ${meta.camera}`,
    meta.software && `Edited or saved with: ${meta.software}`,
    // We never show the location publicly; reviewers only learn that it exists.
    meta.hasGps && "GPS location present (hidden from the public page)",
  ].filter(Boolean);

  return {
    ...base,
    title: meta.takenAt ? `Taken on ${formatDateTime(meta.takenAt)}` : "Image metadata found",
    snippet: facts.join(" · "),
  };
}

/** Reads text in the image with Tesseract (free, runs locally). Returns "" if nothing readable. */
export async function readTextInImage(bytes: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  // The English language file (~10 MB) downloads once and is cached in the temp folder.
  const worker = await createWorker("eng", undefined, { cachePath: join(tmpdir(), "election-verify-ocr") });
  try {
    const result = await Promise.race([
      worker.recognize(bytes),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("OCR timed out")), 45_000)),
    ]);
    return cleanOcrText(result.data.text);
  } finally {
    await worker.terminate();
  }
}

/** Removes lines of OCR noise (very short or mostly symbols). */
export function cleanOcrText(raw: string): string {
  return raw
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 3 && (line.match(/[\p{L}\p{N}]/gu)?.length ?? 0) / line.length > 0.6)
    .join("\n")
    .slice(0, 2000);
}

export function buildOcrEvidence(text: string): NewEvidence {
  return {
    claimId: null,
    kind: "OCR_TEXT",
    title: text ? "Text found in the image" : "No readable text in the image",
    url: null,
    publisher: null,
    rating: null,
    stance: null,
    snippet: text ? text.slice(0, 600) : "No words or signs could be read.",
    publishedAt: null,
  };
}
