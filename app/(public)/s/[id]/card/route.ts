import { NextResponse, type NextRequest } from "next/server";
import { readSubmission } from "@/lib/data";
import { renderVerdictCard } from "@/lib/og/verdict-card";

/** "Download image": the verdict card as a PNG file, for sharing in group chats. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await readSubmission(id);
  if (!submission || submission.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Only published verdicts can be downloaded." }, { status: 404 });
  }
  return renderVerdictCard(submission, {
    "Content-Disposition": `attachment; filename="electionverify-${id}.png"`,
  });
}
