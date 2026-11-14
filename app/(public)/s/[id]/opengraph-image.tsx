import { getSubmission } from "@/lib/data";
import { CARD_SIZE, renderVerdictCard } from "@/lib/og/verdict-card";

/** The picture WhatsApp, Facebook and X show when someone shares a result link. */
export const alt = "ElectionVerify fact-check result";
export const size = CARD_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return renderVerdictCard(await getSubmission(id));
}
