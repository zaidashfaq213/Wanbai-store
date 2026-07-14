import "server-only";
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

export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(toCategory);
}

// --- products ---

type ProductWithCategory = DbProduct & { category: { slug: string } };

function toProductWithCat(p: ProductWithCategory): Product {
  return { ...toProduct(p), category: p.category.slug };
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: { category: { select: { slug: true } } },
  });
  if (!p || !p.active) return undefined;
  return toProductWithCat(p);
}

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
export async function getProductId(slug: string): Promise<string | null> {
  const p = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  return p?.id ?? null;
}

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

export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: {
      variantGroups: {
        orderBy: { sortOrder: "asc" },
        include: { packages: { orderBy: { sortOrder: "asc" } } },
      },
      inputs: { orderBy: { sortOrder: "asc" } },
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

  const inputs: InputField[] = p.inputs.map((i) => ({
    id: i.key,
    label: { ar: i.labelAr, en: i.labelEn },
    placeholder: { ar: i.placeholderAr, en: i.placeholderEn },
    kind: (i.kind as InputField["kind"]) ?? "text",
    required: i.required,
  }));

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
}
