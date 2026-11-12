import { services } from "@/lib/config";
import { ratingToStance } from "@/lib/pipeline/rules";
import type { Claim, NewEvidence } from "@/lib/types";

/**
 * Searches Google's Fact Check Tools API, a free database of fact-checks
 * published by news organizations around the world (ClaimReview data).
 * Docs: https://developers.google.com/fact-check/tools/api
 */

interface ClaimSearchResponse {
  claims?: {
    text?: string;
    claimReview?: {
      publisher?: { name?: string; site?: string };
      url?: string;
      title?: string;
      reviewDate?: string;
      textualRating?: string;
    }[];
  }[];
}

export async function searchFactChecks(claims: Claim[]): Promise<NewEvidence[]> {
  const results: NewEvidence[] = [];
  const seen = new Set<string>();

  for (const claim of claims.slice(0, 3)) {
    const params = new URLSearchParams({ query: claim.text.slice(0, 250), pageSize: "5", key: services.factCheck.apiKey });
    const response = await fetch(`https://factchecktools.googleapis.com/v1alpha1/claims:search?${params}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Fact Check API error ${response.status}`);
    const data = (await response.json()) as ClaimSearchResponse;

    for (const found of data.claims ?? []) {
      const review = found.claimReview?.[0];
      if (!review?.url || seen.has(review.url)) continue;
      seen.add(review.url);
      const date = review.reviewDate ? new Date(review.reviewDate) : null;
      results.push({
        claimId: claim.id,
        kind: "FACT_CHECK",
        title: review.title || found.text || "Fact-check",
        url: review.url,
        publisher: review.publisher?.name ?? review.publisher?.site ?? null,
        rating: review.textualRating ?? null,
        stance: ratingToStance(review.textualRating),
        snippet: found.text ? `Claim checked: “${found.text.slice(0, 280)}”` : null,
        publishedAt: date && !Number.isNaN(date.getTime()) ? date : null,
      });
      if (results.filter((r) => r.claimId === claim.id).length >= 3) break;
    }
  }
  return results;
}
