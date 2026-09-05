import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getCategories, getAllProducts } from "@/lib/data/catalog-db";
import { getPages, getPosts } from "@/lib/data/content";
import { getGsmCategories, getAllGsmServices } from "@/lib/data/gsm";
import { SITE_URL as BASE } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, pages, posts, gsmCategories, gsmServices] = await Promise.all([
    getCategories(),
    getAllProducts(),
    getPages(),
    getPosts(),
    getGsmCategories(),
    getAllGsmServices(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const root = `${BASE}/${locale}`;

    entries.push(
      { url: root, changeFrequency: "daily", priority: 1 },
      { url: `${root}/cards`, changeFrequency: "weekly", priority: 0.9 },
      { url: `${root}/gsm`, changeFrequency: "weekly", priority: 0.9 },
      { url: `${root}/help`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${root}/contact`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${root}/blog`, changeFrequency: "weekly", priority: 0.6 },
    );

    for (const c of categories) {
      entries.push({
        url: `${root}/cards/${c.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const c of gsmCategories) {
      entries.push({
        url: `${root}/gsm/${c.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const s of gsmServices) {
      entries.push({
        url: `${root}/gsm/${s.category.slug}/${s.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const p of products) {
      entries.push({
        url: `${root}/product/${p.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const p of pages) {
      entries.push({
        url: `${root}/pages/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "yearly",
        priority: 0.3,
      });
    }
    for (const p of posts) {
      entries.push({
        url: `${root}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
