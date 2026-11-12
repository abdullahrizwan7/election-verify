import { SOURCE_TYPES } from "@/lib/labels";
import { USER_AGENT } from "@/lib/pipeline/safe-fetch";
import type { NewEvidence, Source } from "@/lib/types";

/**
 * Builds the "About the source" evidence for a link: is the website in our
 * trusted-sources list, how old is the domain, and does it use HTTPS.
 */

const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu", "gob", "nic"]);
const NEW_DOMAIN_DAYS = 90;

/**
 * "news.bbc.co.uk" -> "bbc.co.uk", "www.example.com" -> "example.com".
 * A simple rule that covers most news sites without a full public-suffix list.
 */
export function registrableDomain(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/^www\./, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const tld = labels.at(-1)!;
  const second = labels.at(-2)!;
  const keep = tld.length === 2 && SECOND_LEVEL.has(second) ? 3 : 2;
  return labels.slice(-keep).join(".");
}

/** All the names to try in the sources list, most specific first. */
export function candidateDomains(hostname: string): string[] {
  const labels = hostname.toLowerCase().replace(/^www\./, "").split(".");
  const names: string[] = [];
  for (let i = 0; i < labels.length - 1; i++) names.push(labels.slice(i).join("."));
  return names;
}

/**
 * Asks the public RDAP service when the domain was registered.
 * RDAP is the free, modern replacement for WHOIS. Returns null if unknown.
 */
export async function lookupRegistrationDate(domain: string): Promise<Date | null> {
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(8_000),
      // rdap.org refuses requests without a normal User-Agent.
      headers: { Accept: "application/rdap+json", "User-Agent": USER_AGENT },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { events?: { eventAction?: string; eventDate?: string }[] };
    const registered = data.events?.find((e) => e.eventAction === "registration")?.eventDate;
    const date = registered ? new Date(registered) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}

export function describeAge(registered: Date | null, now = new Date()): string {
  if (!registered) return "domain age unknown";
  const days = Math.floor((now.getTime() - registered.getTime()) / 86_400_000);
  if (days < 1) return "domain registered today";
  if (days < 60) return `domain registered ${days} days ago`;
  const years = Math.floor(days / 365);
  return years >= 1 ? `domain registered in ${registered.getFullYear()} (${years} years ago)` : `domain registered ${Math.floor(days / 30)} months ago`;
}

export function buildSourceEvidence(input: {
  url: URL;
  source: Source | null;
  registered: Date | null;
  now?: Date;
}): NewEvidence {
  const { url, source, registered } = input;
  const host = url.hostname.replace(/^www\./, "");
  const isNew = registered ? (input.now ?? new Date()).getTime() - registered.getTime() < NEW_DOMAIN_DAYS * 86_400_000 : false;

  const facts = [
    source ? `Listed as ${SOURCE_TYPES[source.type].label} · trust ${source.trust}/100` : "Not in our source list",
    describeAge(registered, input.now),
    url.protocol === "https:" ? "uses HTTPS" : "does not use HTTPS",
  ];

  let title: string;
  if (source?.type === "OFFICIAL") title = `${host} is an official source`;
  else if (source?.type === "SATIRE") title = `${host} is a satire website`;
  else if (source?.type === "KNOWN_MISINFO") title = `${host} has published false stories before`;
  else if (source) title = `${host} is a known ${SOURCE_TYPES[source.type].label.toLowerCase()}`;
  else if (isNew) title = `${host} is an unknown website that was registered recently`;
  else title = `${host} is not in our source list`;

  return {
    claimId: null,
    kind: "SOURCE_INFO",
    title,
    url: `${url.protocol}//${url.hostname}`,
    publisher: source?.name ?? null,
    // The source type is kept here so the rule-based suggestion can use it.
    rating: source ? SOURCE_TYPES[source.type].label : isNew ? "New domain" : "Unknown",
    stance: null,
    snippet: facts.join(" · "),
    publishedAt: null,
  };
}
