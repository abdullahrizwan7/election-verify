import { describe, expect, it } from "vitest";
import { INDIA_SOURCES } from "@/lib/data/sources-india";
import { candidateDomains, registrableDomain } from "@/lib/pipeline/source-reputation";
import { trustedSearchDomains } from "@/lib/pipeline/find-web-evidence";

describe("Indian trusted sources", () => {
  it("has no duplicate domains", () => {
    const domains = INDIA_SOURCES.map((s) => s.domain);
    expect(new Set(domains).size).toBe(domains.length);
  });

  it("keeps trust scores between 0 and 100", () => {
    for (const source of INDIA_SOURCES) {
      expect(source.trust).toBeGreaterThanOrEqual(0);
      expect(source.trust).toBeLessThanOrEqual(100);
    }
  });

  it("matches Election Commission subdomains to eci.gov.in", () => {
    expect(registrableDomain("results.eci.gov.in")).toBe("eci.gov.in");
    expect(candidateDomains("voters.eci.gov.in")).toContain("eci.gov.in");
  });
});

describe("trustedSearchDomains", () => {
  it("searches official, fact-check and news sites but never satire or made-up domains", () => {
    const domains = trustedSearchDomains([
      ...INDIA_SOURCES,
      { domain: "elections.gov.example", name: "Sample", type: "OFFICIAL", trust: 95, notes: null },
      { domain: "lowtrust.in", name: "Low trust", type: "NEWS", trust: 40, notes: null },
    ]);
    expect(domains).toContain("eci.gov.in");
    expect(domains).toContain("altnews.in");
    expect(domains).not.toContain("thefauxy.com");
    expect(domains).not.toContain("elections.gov.example");
    expect(domains).not.toContain("lowtrust.in");
  });
});
