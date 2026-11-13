import type { Evidence, Stance, Verdict } from "@/lib/types";

/**
 * Simple rules used when no AI key is connected. They are less smart than the
 * AI, but they keep the whole pipeline working for free and are easy to test.
 */

const ELECTION_WORDS =
  /\b(vote[sdr]?|voting|voters?|ballots?|poll(?:s|ing)?|elections?|electoral|candidates?|commission|count(?:ing|ed)?|results?|registration|register(?:ed)?|ID|constituenc(?:y|ies)|turnout|rigg(?:ed|ing)|fraud)\b/gi;
const CALL_TO_ACTION = /\b(share|forward|retweet|repost|spread the word|before they delete)\b/i;

/** Picks the sentences that look most like checkable election claims. */
export function extractClaimsHeuristic(text: string, max = 3): string[] {
  const sentences = text
    .replace(/https?:\/\/\S+/g, " ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    // Short lines are allowed because posters and screenshots often use them.
    .filter((s) => s.length >= 20 && s.length <= 300 && s.split(" ").length >= 4)
    .filter((s) => !s.endsWith("?") && !CALL_TO_ACTION.test(s));

  const scored = sentences.map((sentence, index) => ({
    sentence,
    index,
    score: (sentence.match(ELECTION_WORDS)?.length ?? 0) * 2 + (/\d/.test(sentence) ? 1 : 0),
  }));

  const best = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, max)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence.replace(/[!]+$/, "."));

  if (best.length > 0) return best;
  const fallback = text.replace(/\s+/g, " ").trim().slice(0, 200);
  return fallback ? [fallback] : [];
}

/** Turns a fact-checker's rating ("Mostly false", "Pants on fire", "True") into a stance. */
export function ratingToStance(rating: string | null | undefined): Stance {
  const r = (rating ?? "").toLowerCase();
  if (/(false|fake|incorrect|wrong|misleading|pants on fire|fabricated|hoax|not true|baseless|no evidence|distorted|scam)/.test(r)) {
    return "REFUTES";
  }
  if (/(half|mixed|partly|partially|unproven|unverified|needs context|missing context)/.test(r)) return "NEUTRAL";
  if (/(true|correct|accurate|confirmed)/.test(r)) return "SUPPORTS";
  return "NEUTRAL";
}

export interface RuleSuggestion {
  verdict: Verdict;
  confidence: number;
  summary: string;
}

const cite = (items: Evidence[]) => items.map((e) => `[${e.id}]`).join(" ");

/** A cautious verdict suggestion from counting supporting and contradicting evidence. */
export function ruleBasedSuggestion(evidence: Evidence[]): RuleSuggestion {
  const intro = "Automatic rule-based suggestion (no AI connected).";
  const source = evidence.find((e) => e.kind === "SOURCE_INFO");
  const factChecks = evidence.filter((e) => e.kind === "FACT_CHECK");
  const refutingChecks = factChecks.filter((e) => e.stance === "REFUTES");
  const supportingChecks = factChecks.filter((e) => e.stance === "SUPPORTS");
  const web = evidence.filter((e) => e.kind === "WEB_SOURCE" || e.kind === "IMAGE_MATCH" || e.kind === "MANUAL");
  const refuting = web.filter((e) => e.stance === "REFUTES");
  const supporting = web.filter((e) => e.stance === "SUPPORTS");

  if (source?.rating === "Satire") {
    return { verdict: "SATIRE", confidence: 0.75, summary: `${intro} The link comes from a website listed as satire ${cite([source])}.` };
  }

  if (refutingChecks.length > 0 && refutingChecks.length >= supportingChecks.length) {
    const misleading = refutingChecks.some((e) => /mislead|context|distort/i.test(e.rating ?? ""));
    return {
      verdict: misleading ? "MISLEADING" : "FALSE",
      confidence: 0.7,
      summary: `${intro} ${refutingChecks.length} existing fact-check(s) rated a matching claim as ${refutingChecks
        .map((e) => `"${e.rating}"`)
        .join(", ")} ${cite(refutingChecks)}. Confirm that they really check the same claim.`,
    };
  }

  if (supportingChecks.length > 0) {
    return {
      verdict: "ACCURATE",
      confidence: 0.6,
      summary: `${intro} Existing fact-check(s) rated a matching claim as true ${cite(supportingChecks)}.`,
    };
  }

  if (refuting.length > supporting.length) {
    return {
      verdict: "FALSE",
      confidence: 0.5,
      summary: `${intro} ${refuting.length} source(s) contradict the claim ${cite(refuting)} and ${supporting.length} support it.`,
    };
  }

  if (supporting.length > refuting.length) {
    const official = source?.rating === "Official";
    return {
      verdict: "ACCURATE",
      confidence: official ? 0.65 : 0.5,
      summary: `${intro} ${supporting.length} source(s) support the claim ${cite(supporting)}${
        official ? ` and the link is from an official source ${cite([source!])}` : ""
      }.`,
    };
  }

  const warnings: string[] = [];
  if (source?.rating === "Known misinformation") warnings.push(`the website has published false stories before ${cite([source])}`);
  if (source?.rating === "New domain") warnings.push(`the website was registered very recently ${cite([source])}`);

  return {
    verdict: "UNVERIFIED",
    confidence: 0.3,
    summary: `${intro} Not enough evidence was found to confirm or reject the claim${
      warnings.length ? `, but ${warnings.join(" and ")}` : ""
    }. Connect the AI, fact-check and web search keys for a stronger suggestion.`,
  };
}
