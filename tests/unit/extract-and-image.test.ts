import { describe, expect, it } from "vitest";
import { buildMetadataEvidence, cleanOcrText } from "@/lib/pipeline/analyze-image";
import { StepError } from "@/lib/pipeline/errors";
import { parseArticle } from "@/lib/pipeline/extract-article";

const paragraph =
  "The National Election Commission said on Monday that voter registration will stay open until 30 November so that first-time voters have more time to register online or at district offices.";

describe("parseArticle", () => {
  it("pulls out the title, text and publish date, and ignores scripts", () => {
    const html = `<!doctype html><html><head>
      <title>Registration extended | Daily News</title>
      <meta property="article:published_time" content="2026-11-09T08:00:00Z">
      </head><body><nav>Home | Politics</nav><article><h1>Registration extended</h1>
      <p>${paragraph}</p><p>${paragraph}</p><p>${paragraph}</p></article>
      <script>document.body.innerHTML = "hacked"</script></body></html>`;

    const article = parseArticle(html, "https://news.example.com/registration");
    expect(article.title).toContain("Registration extended");
    expect(article.text).toContain("30 November");
    expect(article.text).not.toContain("hacked");
    expect(article.publishedAt?.toISOString()).toBe("2026-11-09T08:00:00.000Z");
  });

  it("fails clearly when the page has no article text", () => {
    expect(() => parseArticle("<html><body><p>Login</p></body></html>", "https://example.com")).toThrow(StepError);
  });
});

describe("cleanOcrText", () => {
  it("drops lines of noise and keeps real text", () => {
    expect(cleanOcrText("ELECTION DAY MOVED\n~ ~ |\n  Vote on   Sunday  \n.,")).toBe("ELECTION DAY MOVED\nVote on Sunday");
  });
});

describe("buildMetadataEvidence", () => {
  it("explains that missing metadata proves nothing", () => {
    expect(buildMetadataEvidence(null).title).toBe("No camera metadata");
  });

  it("never reveals the GPS location, only that it exists", () => {
    const e = buildMetadataEvidence({ camera: "Phone X", takenAt: null, software: null, hasGps: true });
    expect(e.snippet).toContain("GPS location present (hidden from the public page)");
    expect(e.snippet).not.toMatch(/\d+\.\d{3,}/); // no coordinates
  });
});
