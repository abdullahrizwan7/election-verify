import { describe, expect, it } from "vitest";
import { hashText, normalizeText, normalizeUrl } from "@/lib/content-hash";
import { reviewSchema, sourceSchema, submissionSchema } from "@/lib/validators";

describe("normalizeUrl", () => {
  it("treats tracking links and the same page as one", () => {
    const a = normalizeUrl("https://www.Example.com/news/story/?utm_source=whatsapp&fbclid=abc#comments");
    const b = normalizeUrl("https://example.com/news/story");
    expect(a).toBe(b);
    expect(hashText(a)).toBe(hashText(b));
  });

  it("keeps parameters that change the content", () => {
    expect(normalizeUrl("https://example.com/article?id=42")).toBe("https://example.com/article?id=42");
  });
});

describe("normalizeText", () => {
  it("ignores case and extra spaces", () => {
    expect(normalizeText("  Polls   CLOSE at\n2 PM ")).toBe(normalizeText("polls close at 2 pm"));
  });
});

describe("submissionSchema", () => {
  it("accepts a valid link", () => {
    expect(submissionSchema.safeParse({ type: "URL", url: "https://example.com/a" }).success).toBe(true);
  });

  it("rejects links that are not http(s)", () => {
    const result = submissionSchema.safeParse({ type: "URL", url: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("requires at least 20 characters of text", () => {
    expect(submissionSchema.safeParse({ type: "TEXT", text: "too short" }).success).toBe(false);
    expect(submissionSchema.safeParse({ type: "TEXT", text: "Polling stations close at 2 PM." }).success).toBe(true);
  });

  it("rejects images that are too big or the wrong type", () => {
    const big = new File([new Uint8Array(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
    const gif = new File([new Uint8Array(10)], "a.gif", { type: "image/gif" });
    expect(submissionSchema.safeParse({ type: "IMAGE", image: big }).success).toBe(false);
    expect(submissionSchema.safeParse({ type: "IMAGE", image: gif }).success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("needs a known verdict and a real explanation", () => {
    expect(reviewSchema.safeParse({ submissionId: "x", verdict: "MAYBE", publicNote: "a".repeat(30) }).success).toBe(false);
    expect(reviewSchema.safeParse({ submissionId: "x", verdict: "FALSE", publicNote: "short" }).success).toBe(false);
    expect(reviewSchema.safeParse({ submissionId: "x", verdict: "FALSE", publicNote: "The official schedule says 8 AM to 5 PM." }).success).toBe(true);
  });
});

describe("sourceSchema", () => {
  it("accepts plain domains only", () => {
    expect(sourceSchema.safeParse({ domain: "Example.COM", name: "Example", type: "NEWS", trust: "70" }).data?.domain).toBe("example.com");
    expect(sourceSchema.safeParse({ domain: "https://example.com", name: "Example", type: "NEWS", trust: 70 }).success).toBe(false);
    expect(sourceSchema.safeParse({ domain: "example.com", name: "Example", type: "NEWS", trust: 140 }).success).toBe(false);
  });
});
