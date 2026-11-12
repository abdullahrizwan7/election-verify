const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: Date | string | null): string {
  return date ? dateFormat.format(new Date(date)) : "";
}

export function formatDateTime(date: Date | string | null): string {
  return date ? dateTimeFormat.format(new Date(date)) : "";
}

/** "5 minutes ago", "3 days ago" */
export function timeAgo(date: Date | string): string {
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(-Math.round(seconds / size), unit);
  }
  return "just now";
}

export function domainOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function percent(value: number | null): string {
  return value == null ? "–" : `${Math.round(value * 100)}%`;
}
