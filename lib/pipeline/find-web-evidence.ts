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

type Result = { title: string; url: string; snippet: string; published?: string };

/** Sites worth searching first: official, fact-checkers and news with decent trust. */
export function trustedSearchDomains(sources: Source[]): string[] {
  return sources
    .filter((s) => s.type !== "SATIRE" && s.type !== "KNOWN_MISINFO" && s.trust >= 70)
    .map((s) => s.domain)
    .filter((domain) => !domain.endsWith(".example"));
}

async function search(query: string, includeDomains: string[] | null): Promise<Result[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${services.tavily.apiKey}` },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      query: query.slice(0, 380),
      max_results: 4,
      search_depth: "basic",
      ...(services.tavily.country ? { country: services.tavily.country } : {}),
      ...(includeDomains ? { include_domains: includeDomains } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Tavily API error ${response.status}`);
  const data = (await response.json()) as TavilyResponse;
  return (data.results ?? [])
    .filter((r) => r.url && r.title)
    .map((r) => ({ title: r.title!, url: r.url!, snippet: (r.content ?? "").slice(0, 400), published: r.published_date }));
}

export async function findWebEvidence(claims: Claim[], sources: Source[]): Promise<NewEvidence[]> {
  const evidence: NewEvidence[] = [];
  const trusted = trustedSearchDomains(sources);

  for (const claim of claims.slice(0, 3)) {
    // Trusted sites first. Only search the open web if they have little to say.
    let results = trusted.length > 0 ? await search(claim.text, trusted) : [];
    if (results.length < 2) {
      const seen = new Set(results.map((r) => r.url));
      const open = (await search(claim.text, null)).filter((r) => !seen.has(r.url));
      results = [...results, ...open].slice(0, 4);
    }
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
