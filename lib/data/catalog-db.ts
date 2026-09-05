import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { Category, Product } from "./catalog";
import type {
  ProductDetail,
  Fulfillment,
  VariantGroup,
  InputField,
  Faq,
  Review,
} from "./product-detail";
import { inputsForProduct } from "./catalog-generate";
import type {
  Category as DbCategory,
  Product as DbProduct,
  ProductFulfillment,
} from "@prisma/client";

// --- mappers: DB rows -> the shapes the storefront components expect ---

function toCategory(c: DbCategory): Category {
  return {
    slug: c.slug,
    name: { ar: c.nameAr, en: c.nameEn },
    icon: c.icon,
    gradient: c.gradient,
  };
}

function toProduct(p: DbProduct): Product {
  return {
    slug: p.slug,
    name: { ar: p.nameAr, en: p.nameEn },
    category: "", // filled by caller when the category slug is known
    badge: { ar: p.badgeAr, en: p.badgeEn },
    initial: p.initial,
    hue: p.hue,
    priceFrom: p.priceFrom / 100,
    rating: p.rating,
    reviews: p.reviewCount,
    image: p.image ?? undefined,
    available: p.available,
  };
}

const FULFILLMENT_MAP: Record<ProductFulfillment, Fulfillment> = {
  TOPUP: "topup",
  CODE: "code",
  SERVICE: "service",
};

// --- categories ---

// Two layers of caching stacked here:
//  - unstable_cache: caches the DB result ACROSS requests for 60s, tagged
//    "categories" so admin edits invalidate it immediately (see catalog.ts
//    actions). This is what makes navigating to the homepage fast — most
//    visits are served without touching Postgres at all.
//  - React cache(): dedupes repeat calls WITHIN one request (the storefront
//    layout and the page both need this).
// Together these were the fix for the slow "home" navigation.
export const getCategories = cache(
  unstable_cache(
    async (): Promise<Category[]> => {
      const rows = await prisma.category.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      });
      return rows.map(toCategory);
    },
    ["catalog:categories"],
    { revalidate: 60, tags: ["categories"] },
  ),
);

// --- products ---

type ProductWithCategory = DbProduct & { category: { slug: string } };

function toProductWithCat(p: ProductWithCategory): Product {
  return { ...toProduct(p), category: p.category.slug };
}

// The product page calls this once in generateMetadata() and again in the
// page body — cache() collapses that to one call per request; unstable_cache
// then serves repeat visits (across requests) without hitting Postgres.
export const getProductBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Product | undefined> => {
      const p = await prisma.product.findUnique({
        where: { slug },
        include: { category: { select: { slug: true } } },
      });
      if (!p || !p.active) return undefined;
      return toProductWithCat(p);
    },
    ["catalog:product-by-slug"],
    { revalidate: 60, tags: ["products"] },
  ),
);

// The homepage fans this out once per category (in parallel) to build each
// showcase row — the single biggest contributor to a slow first paint. Cached
// per (categorySlug, limit) combination for 60s.
export const getProductsByCategory = unstable_cache(
  async (categorySlug: string, limit?: number): Promise<Product[]> => {
    const rows = await prisma.product.findMany({
      where: { active: true, category: { slug: categorySlug } },
      include: { category: { select: { slug: true } } },
      orderBy: { sortOrder: "asc" },
      take: limit,
    });
    return rows.map(toProductWithCat);
  },
  ["catalog:products-by-category"],
  { revalidate: 60, tags: ["products"] },
);

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { active: true },
    include: { category: { select: { slug: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(toProductWithCat);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { nameEn: { contains: q, mode: "insensitive" } },
        { nameAr: { contains: q } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { category: { select: { slug: true } } },
    take: 40,
  });
  return rows.map(toProductWithCat);
}

export async function getRelatedProducts(
  product: Product,
  limit = 6,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      active: true,
      category: { slug: product.category },
      slug: { not: product.slug },
    },
    include: { category: { select: { slug: true } } },
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
  return rows.map(toProductWithCat);
}

/** The product's DB id — needed to attach a customer review. */
export const getProductId = cache(async (slug: string): Promise<string | null> => {
  const p = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  return p?.id ?? null;
});

// --- admin: full rows including inactive ---

export function getAdminCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export function getAdminProducts() {
  return prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { category: { select: { nameEn: true, nameAr: true, slug: true } } },
  });
}

export function getAdminProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variantGroups: {
        orderBy: { sortOrder: "asc" },
        include: { packages: { orderBy: { sortOrder: "asc" } } },
      },
      inputs: { orderBy: { sortOrder: "asc" } },
    },
  });
}

// --- product detail ---

// The heaviest single query on the site (variant groups + packages + faqs +
// reviews in one go) — cached the same way as getProductBySlug above.
export const getProductDetail = cache(
  unstable_cache(
    async (slug: string): Promise<ProductDetail | null> => {
      const p = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: { select: { slug: true } },
          variantGroups: {
            orderBy: { sortOrder: "asc" },
            include: { packages: { orderBy: { sortOrder: "asc" } } },
          },
          faqs: { orderBy: { sortOrder: "asc" } },
          reviews: { orderBy: { sortOrder: "asc" } },
          inputs: { orderBy: { sortOrder: "asc" } },
        },
      });
      if (!p) return null;

  const variantGroups: VariantGroup[] = p.variantGroups.map((g) => ({
    id: g.id,
    name: { ar: g.nameAr, en: g.nameEn },
    packages: g.packages.map((pk) => ({
      id: pk.id,
      label: { ar: pk.labelAr, en: pk.labelEn },
      sublabel:
        pk.sublabelAr || pk.sublabelEn
          ? { ar: pk.sublabelAr ?? "", en: pk.sublabelEn ?? "" }
          : undefined,
      price: pk.price / 100,
      // Only surface it when enabled AND actually higher than the current
      // price — an admin-entered mistake shouldn't render a "discount" that
      // makes the price look like it went up.
      compareAtPrice:
        pk.compareAtEnabled && pk.compareAtPrice != null && pk.compareAtPrice > pk.price
          ? pk.compareAtPrice / 100
          : undefined,
      popular: pk.popular,
    })),
  }));

  // Input fields are derived from the product's category/slug (single source of
  // truth in catalog-generate), so the client's per-game requirements apply to
  // every product — including already-seeded ones — without a DB migration.
  // Admin-added custom fields (ProductInput rows) are merged in on top, and
  // take precedence over an automatic field with the same key. A row with
  // hidden:true still claims its key (so it blocks the automatic default
  // too) but never renders — that's the only way to fully remove a field
  // that has no ProductInput row of its own to delete.
  const auto = inputsForProduct(p.slug, p.category.slug);
  const customKeys = new Set(p.inputs.map((i) => i.key));
  const custom: InputField[] = p.inputs
    .filter((i) => !i.hidden)
    .map((i) => ({
      id: i.key,
      label: { ar: i.labelAr, en: i.labelEn },
      placeholder: { ar: i.placeholderAr, en: i.placeholderEn },
      kind: i.kind === "number" ? "number" : "text",
      required: i.required,
    }));
  const inputs = [...auto.filter((f) => !customKeys.has(f.id)), ...custom];

  const faqs: Faq[] = p.faqs.map((f) => ({
    q: { ar: f.qAr, en: f.qEn },
    a: { ar: f.aAr, en: f.aEn },
  }));

  const reviews: Review[] = p.reviews.map((r) => ({
    name: r.name,
    rating: r.rating,
    comment: { ar: r.commentAr, en: r.commentEn },
    date: r.date,
  }));

  const bd = p.ratingBreakdown;
  const ratingBreakdown: ProductDetail["ratingBreakdown"] = [
    bd[0] ?? 0,
    bd[1] ?? 0,
    bd[2] ?? 0,
    bd[3] ?? 0,
    bd[4] ?? 0,
  ];

      return {
        fulfillment: FULFILLMENT_MAP[p.fulfillment],
        variantGroups,
        inputs,
        overview: { ar: p.overviewAr, en: p.overviewEn },
        howToUse: { ar: p.howToUseAr, en: p.howToUseEn },
        faqs,
        reviews,
        ratingBreakdown,
      };
    },
    ["catalog:product-detail"],
    { revalidate: 60, tags: ["products"] },
  ),
);
