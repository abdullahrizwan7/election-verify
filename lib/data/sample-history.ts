import type { AnalyticsRecord } from "@/lib/analytics";
import type { InputType, Verdict } from "@/lib/types";

/**
 * Made-up history for the analytics charts in demo mode, so they aren't empty.
 * It is generated from a fixed seed, so the charts look the same every time.
 * The dashboard clearly labels it as sample data. With a real database, only
 * real submissions are counted.
 */

/** A tiny random number generator that always gives the same sequence for the same seed. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, weighted: [T, number][]): T {
  let roll = random() * weighted.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [value, weight] of weighted) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return weighted[weighted.length - 1][0];
}

const FINAL: [Verdict, number][] = [
  ["FALSE", 34],
  ["MISLEADING", 22],
  ["ACCURATE", 18],
  ["MISSING_CONTEXT", 12],
  ["UNVERIFIED", 9],
  ["SATIRE", 5],
];

/** When the AI is wrong, it usually picks a "neighbouring" verdict. */
const NEAR_MISS: Record<Verdict, Verdict[]> = {
  FALSE: ["MISLEADING", "UNVERIFIED"],
  MISLEADING: ["MISSING_CONTEXT", "FALSE"],
  MISSING_CONTEXT: ["MISLEADING", "ACCURATE"],
  ACCURATE: ["MISSING_CONTEXT"],
  UNVERIFIED: ["FALSE", "MISLEADING"],
  SATIRE: ["FALSE"],
};

export function generateSampleHistory(days = 60, now = new Date()): AnalyticsRecord[] {
  const random = mulberry32(20261114);
  const records: AnalyticsRecord[] = [];

  for (let d = days; d >= 1; d--) {
    // More rumours as election day gets closer, with busier weekends.
    const date = new Date(now.getTime() - d * 86_400_000);
    const trend = 3 + ((days - d) / days) * 11;
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6 ? 3 : 0;
    const count = Math.max(1, Math.round(trend + weekend + (random() - 0.5) * 6));

    for (let i = 0; i < count; i++) {
      const createdAt = new Date(date.getTime() + random() * 86_400_000);
      if (createdAt > now) continue;
      const type = pick<InputType>(random, [["URL", 45], ["TEXT", 35], ["IMAGE", 20]]);
      const final = pick(random, FINAL);
      const near = NEAR_MISS[final];
      const ai = random() < 0.82 ? final : near[Math.floor(random() * near.length)];
      // Most reviews take a few hours; a few take more than a day.
      const reviewHours = 0.5 + Math.pow(random(), 2.2) * 34;
      const publishedAt = new Date(createdAt.getTime() + reviewHours * 3_600_000);
      const published = publishedAt < now && random() < 0.93;

      records.push({
        type,
        status: published ? "PUBLISHED" : random() < 0.15 ? "FAILED" : "NEEDS_REVIEW",
        aiVerdict: ai,
        finalVerdict: published ? final : null,
        createdAt,
        publishedAt: published ? publishedAt : null,
      });
    }
  }
  return records;
}
