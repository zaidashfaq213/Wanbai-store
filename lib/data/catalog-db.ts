import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Category, Product } from "./catalog";
import type {
  ProductDetail,
  Fulfillment,
  VariantGroup,
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
  };
}

const FULFILLMENT_MAP: Record<ProductFulfillment, Fulfillment> = {
  TOPUP: "topup",
  CODE: "code",
  SERVICE: "service",
};

// --- categories ---

// Wrapped in React's request-scoped cache(): the storefront layout AND each
// page (e.g. the homepage) call this independently to build the header/footer
// nav plus page content. Without dedup that's 2+ identical DB round trips on
// every single navigation — this was the main cause of a slow "home" link.
export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(toCategory);
});

// --- products ---

type ProductWithCategory = DbProduct & { category: { slug: string } };

function toProductWithCat(p: ProductWithCategory): Product {
  return { ...toProduct(p), category: p.category.slug };
}

// The product page calls this once in generateMetadata() and again in the
// page body — cache() collapses that back to a single DB query per request.
export const getProductBySlug = cache(
  async (slug: string): Promise<Product | undefined> => {
    const p = await prisma.product.findUnique({
      where: { slug },
      include: { category: { select: { slug: true } } },
    });
    if (!p || !p.active) return undefined;
    return toProductWithCat(p);
  },
);

export async function getProductsByCategory(
  categorySlug: string,
  limit?: number,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, category: { slug: categorySlug } },
    include: { category: { select: { slug: true } } },
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
  return rows.map(toProductWithCat);
}

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
    },
  });
}

// --- product detail ---

export const getProductDetail = cache(async (slug: string): Promise<ProductDetail | null> => {
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
      popular: pk.popular,
    })),
  }));

  // Input fields are derived from the product's category/slug (single source of
  // truth in catalog-generate), so the client's per-game requirements apply to
  // every product — including already-seeded ones — without a DB migration.
  const inputs = inputsForProduct(p.slug, p.category.slug);

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
});
