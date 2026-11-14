import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages are static by default. Anything that reads the database or the
  // login cookie is wrapped in <Suspense> and streams in per request.
  cacheComponents: true,
  partialPrefetching: true,
  // These libraries load their own files at runtime (OCR worker, HTML parser),
  // so they run from node_modules instead of being bundled.
  serverExternalPackages: ["tesseract.js", "jsdom", "exifr"],
  experimental: {
    serverActions: {
      // Images can be up to 5 MB, plus some room for the form data around them.
      bodySizeLimit: "6mb",
    },
  },
  // Basic browser security settings for every page.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" }, // don't guess file types
          { key: "X-Frame-Options", value: "DENY" }, // other sites can't embed us (clickjacking)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }, // HTTPS only
        ],
      },
      {
        // The offline service worker must always be fresh and may only run our own code.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
