import { describe, expect, it } from "vitest";
import { buildMetadataEvidence, cleanOcrText } from "@/lib/pipeline/analyze-image";
import { StepError } from "@/lib/pipeline/errors";
import { basicArticle, parseArticle } from "@/lib/pipeline/extract-article";

const paragraph =
  "The National Election Commission said on Monday that voter registration will stay open until 30 November so that first-time voters have more time to register online or at district offices.";

describe("parseArticle", () => {
  it("pulls out the title, text and publish date, and ignores scripts", async () => {
    const html = `<!doctype html><html><head>
      <title>Registration extended | Daily News</title>
      <meta property="article:published_time" content="2026-11-09T08:00:00Z">
      </head><body><nav>Home | Politics</nav><article><h1>Registration extended</h1>
      <p>${paragraph}</p><p>${paragraph}</p><p>${paragraph}</p></article>
      <script>document.body.innerHTML = "hacked"</script></body></html>`;

    const article = await parseArticle(html, "https://news.example.com/registration");
    expect(article.title).toContain("Registration extended");
    expect(article.text).toContain("30 November");
    expect(article.text).not.toContain("hacked");
    expect(article.publishedAt?.toISOString()).toBe("2026-11-09T08:00:00.000Z");
  });

  it("fails clearly when the page has no article text", async () => {
    await expect(parseArticle("<html><body><p>Login</p></body></html>", "https://example.com")).rejects.toThrow(StepError);
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

describe("basicArticle (fallback reader)", () => {
  it("pulls out the title, date and paragraph text without scripts or menus", () => {
    const html = `<html><head><title>Fallback title</title><meta property="article:published_time" content="2026-11-01T10:00:00Z"></head>
      <body><nav><p>Home · About · Contact us today please</p></nav><script>alert("x")</script>
      <p>The election commission said polling stations will stay open from 7 am until 6 pm on voting day.</p>
      <p>Voters should carry an approved identity document &amp; their voter slip to the booth.</p></body></html>`;
    const article = basicArticle(html, "https://news.example.com/a");
    expect(article.title).toBe("Fallback title");
    expect(article.text).toContain("polling stations will stay open");
    expect(article.text).toContain("identity document & their voter slip");
    expect(article.text).not.toContain("alert");
    expect(article.text).not.toContain("Contact us");
    expect(article.publishedAt?.toISOString()).toBe("2026-11-01T10:00:00.000Z");
  });

  it("fails clearly when there is no article text", () => {
    expect(() => basicArticle("<html><body><p>Login</p></body></html>", "https://example.com")).toThrow(StepError);
  });
});
