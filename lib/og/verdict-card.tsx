import { ImageResponse } from "next/og";
import { VERDICTS } from "@/lib/labels";
import type { SubmissionDetail, Verdict } from "@/lib/types";

/**
 * Draws a shareable picture of a verdict (1200 × 630). Used for link previews
 * (WhatsApp, X, Facebook) and for the "Download image" button.
 * Only flexbox and inline styles work here.
 */
export const CARD_SIZE = { width: 1200, height: 630 };

const COLORS: Record<Verdict, { bg: string; fg: string }> = {
  ACCURATE: { bg: "#d1fae5", fg: "#065f46" },
  MISLEADING: { bg: "#fef3c7", fg: "#92400e" },
  MISSING_CONTEXT: { bg: "#ffedd5", fg: "#9a3412" },
  FALSE: { bg: "#fee2e2", fg: "#991b1b" },
  UNVERIFIED: { bg: "#e2e8f0", fg: "#334155" },
  SATIRE: { bg: "#ede9fe", fg: "#5b21b6" },
};

export function renderVerdictCard(submission: SubmissionDetail | null, headers?: Record<string, string>) {
  const verdict = submission?.status === "PUBLISHED" ? submission.finalVerdict : null;
  const title = submission?.title ?? "Election claim";
  const color = verdict ? COLORS[verdict] : { bg: "#e0f2fe", fg: "#075985" };
  const note = verdict && submission?.publicNote ? submission.publicNote : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg, #0b1020 0%, #141b3a 60%, #1e1b4b 100%)", color: "#f8fafc", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 700 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #38bdf8, #2563eb 55%, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>✓</div>
          ElectionVerify
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", padding: "12px 30px", borderRadius: 999, background: color.bg, color: color.fg, fontSize: 46, fontWeight: 700 }}>
              {verdict ? VERDICTS[verdict].label : "Being checked"}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700, lineHeight: 1.15 }}>
            {title.length > 100 ? `${title.slice(0, 97)}…` : title}
          </div>
          {note && (
            <div style={{ display: "flex", fontSize: 26, color: "#cbd5e1", lineHeight: 1.35 }}>
              {note.length > 150 ? `${note.slice(0, 147)}…` : note}
            </div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#94a3b8" }}>
          {verdict ? "Checked by a human reviewer · see the evidence on ElectionVerify" : "A human reviewer publishes every verdict"}
        </div>
      </div>
    ),
    { ...CARD_SIZE, headers },
  );
}
