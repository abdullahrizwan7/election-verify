import { NextResponse, type NextRequest } from "next/server";
import { searchPublished } from "@/lib/data";

/** Quick search of published verdicts, used by the command palette (Ctrl/⌘ + K). */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ results: [] });

  const results = (await searchPublished(query)).slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    verdict: item.finalVerdict,
  }));
  return NextResponse.json({ results });
}
