import type { MetadataRoute } from "next";

/** Lets people install ElectionVerify on their phone's home screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ElectionVerify",
    short_name: "ElectionVerify",
    description: "Check election news before you share it. AI-assisted, human-reviewed.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Submit a claim", url: "/submit" },
      { name: "Verified claims", url: "/verified" },
    ],
  };
}
