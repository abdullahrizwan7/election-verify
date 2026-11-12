import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { StepError } from "@/lib/pipeline/errors";

/**
 * Fetches a web page that a user submitted, safely.
 *
 * A user could submit a link like http://localhost:5432 or http://169.254.169.254
 * to make our server read private systems (this attack is called SSRF).
 * So before every request, and after every redirect, we check that the
 * address belongs to the public internet. We also limit time and size.
 *
 * Known limit: the address is checked before connecting, so a site that changes
 * its DNS answer within milliseconds could still slip through. A production
 * system would pin the checked IP address for the connection.
 */

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 3 * 1024 * 1024;
/** Some sites refuse requests that don't say who is asking. */
export const USER_AGENT = "Mozilla/5.0 (compatible; ElectionVerifyBot/0.1; fact-checking research)";

/** True only for normal public internet addresses. */
export function isPublicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  // `process` turns IPv4 addresses written as IPv6 (::ffff:10.0.0.1) back into IPv4.
  return ipaddr.process(address).range() === "unicast";
}

/** Throws if the URL is not an http(s) link to a public host on a normal port. */
export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new StepError("This is not a valid link.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new StepError("Only http and https links can be checked.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new StepError("Links to unusual ports can't be checked.");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new StepError("Links to private networks can't be checked.");
  }

  const addresses = ipaddr.isValid(host)
    ? [host]
    : await lookup(host, { all: true }).then(
        (results) => results.map((r) => r.address),
        () => {
          throw new StepError("We couldn't find this website. Check that the link is correct.");
        },
      );

  if (addresses.length === 0 || !addresses.every(isPublicAddress)) {
    throw new StepError("Links to private networks can't be checked.");
  }
  return url;
}

export interface FetchedPage {
  url: string;
  contentType: string;
  body: string;
}

export async function safeFetchPage(rawUrl: string): Promise<FetchedPage> {
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertSafeUrl(current);

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      throw new StepError(timedOut ? "The website took too long to answer." : "We couldn't connect to this website.", {
        cause: error,
      });
    }

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, url).toString();
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      throw new StepError("The site blocked automatic reading. Ask the person who sent it to paste the text or upload a screenshot.");
    }
    if (!response.ok) {
      throw new StepError(`The website answered with an error (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/html|xml/.test(contentType)) {
      throw new StepError("This link isn't a web page. For images or PDFs, upload a screenshot instead.");
    }

    return { url: url.toString(), contentType, body: await readLimited(response) };
  }

  throw new StepError("The link redirects too many times.");
}

/** Reads the response body but stops at MAX_BYTES, so a huge page can't fill the server's memory. */
async function readLimited(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
