import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/data";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** A list of public pages for search engines, so people searching a rumour can find our verdict. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const published = await listPublished();
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/verified`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...published.map((item) => ({
      url: `${base}/s/${item.id}`,
      lastModified: item.publishedAt ?? item.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
