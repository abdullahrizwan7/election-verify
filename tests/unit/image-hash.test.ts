import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { buildSimilarImageEvidence, findSimilarImages, hammingDistance, imageFingerprint } from "@/lib/pipeline/image-hash";

/** Draws a simple test picture: a dark shape on a light background. */
function picture(shape: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#eee"/>${shape}</svg>`;
  return sharp(Buffer.from(svg));
}
const CIRCLE = `<circle cx="120" cy="150" r="90" fill="#222"/>`;
const BARS = `<rect x="250" y="20" width="40" height="260" fill="#222"/><rect x="20" y="20" width="40" height="260" fill="#222"/>`;

describe("hammingDistance", () => {
  it("counts the differing bits", () => {
    expect(hammingDistance("0000000000000000", "0000000000000000")).toBe(0);
    expect(hammingDistance("0000000000000000", "000000000000000f")).toBe(4);
    expect(hammingDistance("ffffffffffffffff", "0000000000000000")).toBe(64);
    expect(hammingDistance("short", "0000000000000000")).toBe(64);
  });
});

describe("imageFingerprint", () => {
  it("gives the same picture almost the same fingerprint after resizing and re-compressing", async () => {
    const original = await picture(CIRCLE).png().toBuffer();
    const forwarded = await sharp(original).resize(150).jpeg({ quality: 40 }).toBuffer(); // like a WhatsApp forward
    const a = await imageFingerprint(original);
    const b = await imageFingerprint(forwarded);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(hammingDistance(a!, b!)).toBeLessThanOrEqual(6);
  });

  it("gives different pictures clearly different fingerprints", async () => {
    const a = await imageFingerprint(await picture(CIRCLE).png().toBuffer());
    const b = await imageFingerprint(await picture(BARS).png().toBuffer());
    expect(hammingDistance(a!, b!)).toBeGreaterThan(10);
  });

  it("returns null for files that aren't images", async () => {
    expect(await imageFingerprint(Buffer.from("not an image"))).toBeNull();
  });
});

describe("findSimilarImages", () => {
  const base = { title: "t", status: "PUBLISHED" as const, finalVerdict: "MISLEADING" as const, createdAt: new Date("2026-11-01") };

  it("keeps close matches, closest first, and links published ones publicly", () => {
    const matches = findSimilarImages("0000000000000000", [
      { ...base, id: "far", imageHash: "ffffffffffffffff" },
      { ...base, id: "close", imageHash: "0000000000000003" },
      { ...base, id: "same", imageHash: "0000000000000000" },
    ]);
    expect(matches.map((m) => m.id)).toEqual(["same", "close"]);

    const [evidence] = buildSimilarImageEvidence(matches);
    expect(evidence.url).toBe("/s/same");
    expect(evidence.snippet).toContain("100% similar");
    expect(evidence.snippet).toContain("Published verdict: Misleading");
  });
});
