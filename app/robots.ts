import type { MetadataRoute } from "next";
import { SITE_URL as BASE } from "@/lib/seo";

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
