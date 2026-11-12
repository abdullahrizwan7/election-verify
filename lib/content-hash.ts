import "server-only";
import { createHash } from "node:crypto";

/**
 * A fingerprint of the submitted content. Two people sending the same link,
 * text or image get the same hash, so we can reuse a published result
 * instead of checking it again.
 */
export function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeUrl(raw: string): string {
  const url = new URL(raw.trim());
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  // Tracking parameters do not change the content.
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || key === "fbclid" || key === "gclid") url.searchParams.delete(key);
  }
  return url.toString().replace(/\/$/, "");
}

export function normalizeText(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function hashFile(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  return createHash("sha256").update(bytes).digest("hex");
}
