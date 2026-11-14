import type { InputType, Status, Verdict } from "@/lib/types";

/** The fields analytics needs from each submission. */
export interface AnalyticsRecord {
  type: InputType;
  status: Status;
  aiVerdict: Verdict | null;
  finalVerdict: Verdict | null;
  createdAt: Date;
  publishedAt: Date | null;
}

export interface TopReported {
  id: string;
  title: string;
  reportCount: number;
  status: Status;
  finalVerdict: Verdict | null;
}

export interface Analytics {
  /** True when the numbers include generated sample history (demo mode). */
  isSample: boolean;
  rangeDays: number;
  daily: { date: string; submitted: number; published: number }[];
  totals: { submitted: number; published: number; pending: number };
  verdicts: { verdict: Verdict; count: number }[];
  byType: { type: InputType; count: number }[];
  /** How often the reviewer's final verdict matched the AI's suggestion. */
  agreement: { agreed: number; reviewed: number };
  /** AI suggestion (rows) against the reviewer's final verdict (columns). */
  matrix: { ai: Verdict; final: Verdict; count: number }[];
  medianReviewHours: number | null;
  topReported: TopReported[];
}

const VERDICTS: Verdict[] = ["ACCURATE", "MISLEADING", "MISSING_CONTEXT", "FALSE", "UNVERIFIED", "SATIRE"];
const TYPES: InputType[] = ["URL", "TEXT", "IMAGE"];

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Turns raw submissions into the numbers and series the dashboard shows. Pure, so it is easy to test. */
export function computeAnalytics(
  records: AnalyticsRecord[],
  options: { rangeDays: number; now?: Date; isSample?: boolean; topReported?: TopReported[] },
): Analytics {
  const now = options.now ?? new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (options.rangeDays - 1));

  const inRange = records.filter((r) => r.createdAt >= start && r.createdAt <= now);

  // One entry per day, including days with nothing, so the chart has no gaps.
  const daily = Array.from({ length: options.rangeDays }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    return { date: dayKey(date), submitted: 0, published: 0 };
  });
  const byDay = new Map(daily.map((d) => [d.date, d]));
  for (const r of inRange) byDay.get(dayKey(r.createdAt))!.submitted += 1;
  for (const r of records) {
    if (r.publishedAt && r.publishedAt >= start && r.publishedAt <= now) {
      const day = byDay.get(dayKey(r.publishedAt));
      if (day) day.published += 1;
    }
  }

  const published = inRange.filter((r) => r.status === "PUBLISHED" && r.finalVerdict);
  const reviewed = published.filter((r) => r.aiVerdict);

  const matrix: Analytics["matrix"] = [];
  for (const ai of VERDICTS) {
    for (const final of VERDICTS) {
      matrix.push({ ai, final, count: reviewed.filter((r) => r.aiVerdict === ai && r.finalVerdict === final).length });
    }
  }

  const hours = published
    .filter((r) => r.publishedAt)
    .map((r) => (r.publishedAt!.getTime() - r.createdAt.getTime()) / 3_600_000)
    .sort((a, b) => a - b);
  const median = hours.length
    ? hours.length % 2
      ? hours[(hours.length - 1) / 2]
      : (hours[hours.length / 2 - 1] + hours[hours.length / 2]) / 2
    : null;

  return {
    isSample: options.isSample ?? false,
    rangeDays: options.rangeDays,
    daily,
    totals: {
      submitted: inRange.length,
      published: published.length,
      pending: inRange.filter((r) => r.status !== "PUBLISHED" && r.status !== "FAILED").length,
    },
    verdicts: VERDICTS.map((verdict) => ({ verdict, count: published.filter((r) => r.finalVerdict === verdict).length })),
    byType: TYPES.map((type) => ({ type, count: inRange.filter((r) => r.type === type).length })),
    agreement: { agreed: reviewed.filter((r) => r.aiVerdict === r.finalVerdict).length, reviewed: reviewed.length },
    matrix,
    medianReviewHours: median === null ? null : Math.round(median * 10) / 10,
    topReported: options.topReported ?? [],
  };
}
