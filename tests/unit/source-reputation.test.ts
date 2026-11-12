import { describe, expect, it } from "vitest";
import { buildSourceEvidence, candidateDomains, describeAge, registrableDomain } from "@/lib/pipeline/source-reputation";

describe("registrableDomain", () => {
  it.each([
    ["www.example.com", "example.com"],
    ["news.example.com", "example.com"],
    ["news.bbc.co.uk", "bbc.co.uk"],
    ["elections.gov.pk", "elections.gov.pk"],
    ["example.com", "example.com"],
  ])("%s -> %s", (host, expected) => {
    expect(registrableDomain(host)).toBe(expected);
  });
});

describe("candidateDomains", () => {
  it("lists the host and each parent domain", () => {
    expect(candidateDomains("www.news.example.com")).toEqual(["news.example.com", "example.com"]);
  });
});

describe("describeAge", () => {
  const now = new Date("2026-11-13T00:00:00Z");
  it("describes young and old domains", () => {
    expect(describeAge(new Date("2026-11-01T00:00:00Z"), now)).toBe("domain registered 12 days ago");
    expect(describeAge(new Date("2004-05-01T00:00:00Z"), now)).toBe("domain registered in 2004 (22 years ago)");
    expect(describeAge(null, now)).toBe("domain age unknown");
  });
});

describe("buildSourceEvidence", () => {
  const now = new Date("2026-11-13T00:00:00Z");

  it("labels official sources", () => {
    const e = buildSourceEvidence({
      url: new URL("https://elections.gov.example/news"),
      source: { domain: "elections.gov.example", name: "Election Commission", type: "OFFICIAL", trust: 95, notes: null },
      registered: new Date("2004-01-01"),
      now,
    });
    expect(e.title).toBe("elections.gov.example is an official source");
    expect(e.rating).toBe("Official");
    expect(e.snippet).toContain("trust 95/100");
  });

  it("warns about unknown domains registered recently", () => {
    const e = buildSourceEvidence({ url: new URL("http://vote-alert.example"), source: null, registered: new Date("2026-11-01"), now });
    expect(e.title).toContain("registered recently");
    expect(e.rating).toBe("New domain");
    expect(e.snippet).toContain("does not use HTTPS");
  });
});
