import { ImageResponse } from "next/og";
import { getSubmission } from "@/lib/data";
import { VERDICTS } from "@/lib/labels";
import type { Verdict } from "@/lib/types";

/**
 * The picture WhatsApp, Facebook and X show when someone shares a result link.
 * Drawn from JSX with simple inline styles (only flexbox is supported here).
 */
export const alt = "ElectionVerify fact-check result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS: Record<Verdict, { bg: string; fg: string }> = {
  ACCURATE: { bg: "#d1fae5", fg: "#065f46" },
  MISLEADING: { bg: "#fef3c7", fg: "#92400e" },
  MISSING_CONTEXT: { bg: "#ffedd5", fg: "#9a3412" },
  FALSE: { bg: "#fee2e2", fg: "#991b1b" },
  UNVERIFIED: { bg: "#e2e8f0", fg: "#334155" },
  SATIRE: { bg: "#ede9fe", fg: "#5b21b6" },
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await getSubmission(id);
  const verdict = submission?.status === "PUBLISHED" ? submission.finalVerdict : null;
  const title = submission?.title ?? "Election claim";
  const color = verdict ? COLORS[verdict] : { bg: "#e0f2fe", fg: "#075985" };

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#ffffff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 700, color: "#1e3a8a" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1d4ed8", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✓</div>
          ElectionVerify
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", padding: "12px 28px", borderRadius: 999, background: color.bg, color: color.fg, fontSize: 44, fontWeight: 700 }}>
              {verdict ? VERDICTS[verdict].label : "Being checked"}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, color: "#0f172a", lineHeight: 1.15 }}>
            {title.length > 110 ? `${title.slice(0, 107)}…` : title}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#475569" }}>
          {verdict ? "Checked by a human reviewer · evidence on the page" : "A human reviewer publishes every verdict"}
        </div>
      </div>
    ),
    size,
  );
}
