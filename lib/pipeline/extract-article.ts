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
  let libs;
  try {
    libs = await Promise.all([import("jsdom"), import("@mozilla/readability")]);
  } catch (error) {
    // If the full reader can't load on this server, fall back to a simple extractor.
    console.error("Article reader unavailable, using the simple extractor", error);
    return basicArticle(html, url);
  }
  const [{ JSDOM, VirtualConsole }, { Readability }] = libs;
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

/**
 * A simple, dependency-free fallback: the page title, metadata and the text of its
 * paragraphs and headings, with scripts, styles, navigation and footers removed.
 */
export function basicArticle(html: string, url: string): Article {
  const decode = (value: string) =>
    value
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
  const meta = (attr: string, name: string) => {
    const tag = html.match(new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]*>`, "i"))?.[0];
    const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    return content ? decode(content).trim() : null;
  };
  const cleaned = html
    .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const blocks = [...cleaned.matchAll(/<(p|h1|h2|h3|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => decode(m[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 30);
  const text = blocks.join("\n").trim();
  if (text.length < 80) {
    throw new StepError("We couldn't find article text on this page. Paste the text or upload a screenshot instead.");
  }
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const publishedRaw = meta("property", "article:published_time") ?? meta("name", "date");
  const published = publishedRaw ? new Date(publishedRaw) : null;
  return {
    url,
    title: meta("property", "og:title") ?? (titleTag ? decode(titleTag).trim() : null),
    text: text.slice(0, MAX_TEXT),
    byline: meta("name", "author"),
    siteName: meta("property", "og:site_name"),
    publishedAt: published && !Number.isNaN(published.getTime()) ? published : null,
  };
}
