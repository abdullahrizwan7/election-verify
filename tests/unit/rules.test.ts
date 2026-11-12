import { describe, expect, it } from "vitest";
import { extractClaimsHeuristic, ratingToStance, ruleBasedSuggestion } from "@/lib/pipeline/rules";
import type { Evidence } from "@/lib/types";

function evidence(item: Partial<Evidence> & Pick<Evidence, "id" | "kind">): Evidence {
  return { claimId: null, title: "t", url: null, publisher: null, rating: null, stance: null, snippet: null, publishedAt: null, ...item };
}

describe("extractClaimsHeuristic", () => {
  it("keeps election statements and drops calls to share", () => {
    const text =
      "URGENT!!! Polling stations will close at 2 PM on election day. Share this with everyone before they delete it! What do you think?";
    expect(extractClaimsHeuristic(text)).toEqual(["Polling stations will close at 2 PM on election day."]);
  });

  it("returns at most the requested number of claims, in original order", () => {
    const text = [
      "Voter registration closes on 30 November.",
      "The weather was nice today in the city.",
      "Ballots will be counted in 12 districts overnight.",
      "Election results will be announced on Monday.",
    ].join(" ");
    expect(extractClaimsHeuristic(text, 2)).toEqual([
      "Voter registration closes on 30 November.",
      "Ballots will be counted in 12 districts overnight.",
    ]);
  });

  it("falls back to the start of the text when nothing looks like a claim", () => {
    expect(extractClaimsHeuristic("Wow look at this")).toEqual(["Wow look at this"]);
    expect(extractClaimsHeuristic("   ")).toEqual([]);
  });
});

describe("ratingToStance", () => {
  it.each([
    ["False", "REFUTES"],
    ["Mostly false", "REFUTES"],
    ["Pants on Fire", "REFUTES"],
    ["Misleading", "REFUTES"],
    ["Half true", "NEUTRAL"],
    ["Missing context", "NEUTRAL"],
    ["True", "SUPPORTS"],
    ["Correct", "SUPPORTS"],
    [null, "NEUTRAL"],
  ])("%s -> %s", (rating, stance) => {
    expect(ratingToStance(rating)).toBe(stance);
  });
});

describe("ruleBasedSuggestion", () => {
  it("suggests Satire for satire websites", () => {
    const result = ruleBasedSuggestion([evidence({ id: "s1", kind: "SOURCE_INFO", rating: "Satire" })]);
    expect(result.verdict).toBe("SATIRE");
    expect(result.summary).toContain("[s1]");
  });

  it("suggests False when fact-checkers rated it false, citing them", () => {
    const result = ruleBasedSuggestion([
      evidence({ id: "f1", kind: "FACT_CHECK", rating: "False", stance: "REFUTES" }),
      evidence({ id: "w1", kind: "WEB_SOURCE", stance: "SUPPORTS" }),
    ]);
    expect(result.verdict).toBe("FALSE");
    expect(result.summary).toContain("[f1]");
  });

  it("suggests Misleading when the fact-check says so", () => {
    const result = ruleBasedSuggestion([evidence({ id: "f1", kind: "FACT_CHECK", rating: "Misleading", stance: "REFUTES" })]);
    expect(result.verdict).toBe("MISLEADING");
  });

  it("suggests Accurate when sources agree, with more confidence for official links", () => {
    const official = ruleBasedSuggestion([
      evidence({ id: "s1", kind: "SOURCE_INFO", rating: "Official" }),
      evidence({ id: "w1", kind: "WEB_SOURCE", stance: "SUPPORTS" }),
    ]);
    const unknown = ruleBasedSuggestion([evidence({ id: "w1", kind: "WEB_SOURCE", stance: "SUPPORTS" })]);
    expect(official.verdict).toBe("ACCURATE");
    expect(official.confidence).toBeGreaterThan(unknown.confidence);
  });

  it("stays Unverified without evidence and warns about new domains", () => {
    const result = ruleBasedSuggestion([evidence({ id: "s1", kind: "SOURCE_INFO", rating: "New domain" })]);
    expect(result.verdict).toBe("UNVERIFIED");
    expect(result.summary).toContain("registered very recently [s1]");
  });
});
