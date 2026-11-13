import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Tells search engines what to index: public results yes, private dashboards no. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/review", "/admin", "/my", "/login", "/api/", "/auth/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
