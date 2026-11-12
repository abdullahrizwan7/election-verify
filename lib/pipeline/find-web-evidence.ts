import { aiClassifyStances } from "@/lib/ai/tasks";
import { isAiConfigured } from "@/lib/ai/gemini";
import { services } from "@/lib/config";
import { domainOf } from "@/lib/format";
import type { Claim, NewEvidence, Source, Stance } from "@/lib/types";

/**
 * Finds news articles and official pages about each claim with Tavily
 * (a search API made for AI apps, with free monthly credits).
 * If the AI is connected it also decides whether each result supports or
 * contradicts the claim. Otherwise results are marked neutral for the reviewer.
 */

interface TavilyResponse {
  results?: { title?: string; url?: string; content?: string; published_date?: string }[];
}

export async function findWebEvidence(claims: Claim[], sources: Source[]): Promise<NewEvidence[]> {
  const evidence: NewEvidence[] = [];

  for (const claim of claims.slice(0, 3)) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${services.tavily.apiKey}` },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ query: claim.text.slice(0, 380), max_results: 4, search_depth: "basic" }),
    });
    if (!response.ok) throw new Error(`Tavily API error ${response.status}`);
    const data = (await response.json()) as TavilyResponse;

    const results = (data.results ?? [])
      .filter((r) => r.url && r.title)
      .map((r) => ({ title: r.title!, url: r.url!, snippet: (r.content ?? "").slice(0, 400), published: r.published_date }));
    if (results.length === 0) continue;

    let stances: Stance[] = results.map(() => "NEUTRAL");
    if (isAiConfigured()) {
      stances = await aiClassifyStances(claim.text, results).catch(() => stances);
    }

    results.forEach((r, i) => {
      const domain = domainOf(r.url);
      const known = sources.find((s) => domain === s.domain || domain?.endsWith(`.${s.domain}`));
      const date = r.published ? new Date(r.published) : null;
      evidence.push({
        claimId: claim.id,
        kind: "WEB_SOURCE",
        title: r.title,
        url: r.url,
        publisher: known ? `${known.name} (${known.type === "OFFICIAL" ? "official" : `trust ${known.trust}/100`})` : domain,
        rating: null,
        stance: stances[i],
        snippet: r.snippet || null,
        publishedAt: date && !Number.isNaN(date.getTime()) ? date : null,
      });
    });
  }
  return evidence;
}
