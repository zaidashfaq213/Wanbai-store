import type { MetadataRoute } from "next";

const BASE = (process.env.AUTH_URL ?? "https://wanbai-store.tech").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private areas — nothing to index and they all require auth anyway.
      disallow: ["/api/", "/*/admin", "/*/dashboard"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
