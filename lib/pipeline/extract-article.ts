import { StepError } from "@/lib/pipeline/errors";
import { safeFetchPage } from "@/lib/pipeline/safe-fetch";

export interface Article {
  url: string;
  title: string | null;
  text: string;
  byline: string | null;
  siteName: string | null;
  publishedAt: Date | null;
}

const MAX_TEXT = 20_000;

/**
 * Opens a news link and pulls out the readable article text, the same way
 * Firefox's Reader View does (that is what the Readability library is).
 */
export async function extractArticle(url: string): Promise<Article> {
  const page = await safeFetchPage(url);
  return parseArticle(page.body, page.url);
}

/** Separate from the fetch so it can be tested with saved HTML. */
export async function parseArticle(html: string, url: string): Promise<Article> {
  // Loaded only when a link is actually read, so a problem with these libraries can
  // never break other pages or the submit form (they load nothing from here).
  const [{ JSDOM, VirtualConsole }, { Readability }] = await Promise.all([import("jsdom"), import("@mozilla/readability")]);
  // Scripts are not run and images are not loaded. The empty console hides CSS warnings.
  const dom = new JSDOM(html, { url, virtualConsole: new VirtualConsole() });
  const doc = dom.window.document;

  const meta = (selector: string) => doc.querySelector(selector)?.getAttribute("content")?.trim() || null;
  const publishedRaw =
    meta('meta[property="article:published_time"]') ?? meta('meta[name="date"]') ?? meta('meta[itemprop="datePublished"]');
  const published = publishedRaw ? new Date(publishedRaw) : null;

  const article = new Readability(doc).parse();
  const text = (article?.textContent ?? "").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();

  if (text.length < 80) {
    throw new StepError("We couldn't find article text on this page. Paste the text or upload a screenshot instead.");
  }

  dom.window.close();
  return {
    url,
    title: article?.title?.trim() || meta('meta[property="og:title"]'),
    text: text.slice(0, MAX_TEXT),
    byline: article?.byline?.trim() || null,
    siteName: article?.siteName?.trim() || meta('meta[property="og:site_name"]'),
    publishedAt: published && !Number.isNaN(published.getTime()) ? published : null,
  };
}
