import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages are static by default. Anything that reads the database or the
  // login cookie is wrapped in <Suspense> and streams in per request.
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      // Images can be up to 5 MB, plus some room for the form data around them.
      bodySizeLimit: "6mb",
    },
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
