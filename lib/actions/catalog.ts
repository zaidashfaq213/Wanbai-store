"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { buildDetail, FULFILLMENT } from "@/lib/data/catalog-generate";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}
async function requireAdminUser() {
  const user = await getSessionUser();
  return user && user.role === "ADMIN" ? user : null;
}
const cents = (usd: number) => Math.round(usd * 100);

export type CatalogState = { ok: boolean; code?: string };

// --- Categories ------------------------------------------------------------

const categorySchema = z.object({
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  nameEn: z.string().trim().min(1).max(60),
  nameAr: z.string().trim().min(1).max(60),
  icon: z.string().trim().min(1).max(8),
  gradient: z.string().trim().min(1).max(80),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean(),
});

export async function createCategory(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const parsed = categorySchema.safeParse({
    slug: formData.get("slug"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    icon: formData.get("icon"),
    gradient: formData.get("gradient"),
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const exists = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return { ok: false, code: "slug_taken" };

  await prisma.category.create({ data: parsed.data });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/categories`);
  return { ok: true, code: "saved" };
}

export async function updateCategory(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.omit({ slug: true }).safeParse({
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    icon: formData.get("icon"),
    gradient: formData.get("gradient"),
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  await prisma.category.update({ where: { id }, data: parsed.data });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/categories`);
  return { ok: true, code: "saved" };
}

export async function deleteCategory(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return; // don't delete a category that still has products
  await prisma.category.delete({ where: { id } });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/categories`);
}

// --- Products --------------------------------------------------------------

const productSchema = z.object({
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/),
  categoryId: z.string().min(1),
  nameEn: z.string().trim().min(1).max(80),
  nameAr: z.string().trim().min(1).max(80),
  badgeEn: z.string().trim().max(40).default("Instant"),
  badgeAr: z.string().trim().max(40).default("تسليم فوري"),
  initial: z.string().trim().min(1).max(4),
  priceFromUsd: z.coerce.number().min(0).max(100000),
  image: z.string().trim().max(300).optional(),
  active: z.boolean(),
});

// Create a product and materialise sensible default packages/inputs/faqs so it
// works on the storefront immediately; admin can then tweak prices/labels.
export async function createProduct(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));
  const parsed = productSchema.safeParse({
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    badgeEn: formData.get("badgeEn") || "Instant",
    badgeAr: formData.get("badgeAr") || "تسليم فوري",
    initial: formData.get("initial"),
    priceFromUsd: formData.get("priceFromUsd"),
    image: formData.get("image") || undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const exists = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return { ok: false, code: "slug_taken" };

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { ok: false, code: "invalid_input" };

  const d = parsed.data;
  const detail = buildDetail({
    slug: d.slug,
    name: { en: d.nameEn, ar: d.nameAr },
    category: category.slug,
    badge: { en: d.badgeEn, ar: d.badgeAr },
    initial: d.initial,
    hue: 280,
    priceFrom: d.priceFromUsd,
    rating: 5,
    reviews: 0,
  });

  const created = await prisma.product.create({
    data: {
      slug: d.slug,
      categoryId: d.categoryId,
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      badgeEn: d.badgeEn,
      badgeAr: d.badgeAr,
      initial: d.initial,
      priceFrom: cents(d.priceFromUsd),
      image: d.image || null,
      active: d.active,
      fulfillment: (FULFILLMENT[category.slug] ?? "code").toUpperCase() as
        | "TOPUP"
        | "CODE"
        | "SERVICE",
      overviewEn: detail.overview.en,
      overviewAr: detail.overview.ar,
      howToUseEn: detail.howToUse.en,
      howToUseAr: detail.howToUse.ar,
      ratingBreakdown: [0, 0, 0, 0, 0],
      variantGroups: {
        create: detail.variantGroups.map((g, gi) => ({
          nameEn: g.name.en,
          nameAr: g.name.ar,
          sortOrder: gi,
          packages: {
            create: g.packages.map((pk, pi) => ({
              labelEn: pk.label.en,
              labelAr: pk.label.ar,
              price: cents(pk.price),
              popular: pk.popular ?? false,
              sortOrder: pi,
            })),
          },
        })),
      },
      inputs: {
        create: detail.inputs.map((inp, ii) => ({
          key: inp.id,
          labelEn: inp.label.en,
          labelAr: inp.label.ar,
          placeholderEn: inp.placeholder.en,
          placeholderAr: inp.placeholder.ar,
          kind: inp.kind,
          required: inp.required ?? false,
          sortOrder: ii,
        })),
      },
      faqs: {
        create: detail.faqs.map((f, fi) => ({
          qEn: f.q.en,
          qAr: f.q.ar,
          aEn: f.a.en,
          aAr: f.a.ar,
          sortOrder: fi,
        })),
      },
    },
  });

  revalidatePath(`/${locale}/admin/products`);
  redirect(`/${locale}/admin/products/${created.id}`);
}

const productUpdateSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  nameEn: z.string().trim().min(1).max(80),
  nameAr: z.string().trim().min(1).max(80),
  badgeEn: z.string().trim().max(40),
  badgeAr: z.string().trim().max(40),
  initial: z.string().trim().min(1).max(4),
  priceFromUsd: z.coerce.number().min(0).max(100000),
  image: z.string().trim().max(300).optional(),
  fulfillment: z.enum(["TOPUP", "CODE", "SERVICE"]),
  overviewEn: z.string().trim().max(2000),
  overviewAr: z.string().trim().max(2000),
  howToUseEn: z.string().trim().max(2000),
  howToUseAr: z.string().trim().max(2000),
  active: z.boolean(),
});

export async function updateProduct(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));
  const parsed = productUpdateSchema.safeParse({
    id: formData.get("id"),
    categoryId: formData.get("categoryId"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    badgeEn: formData.get("badgeEn"),
    badgeAr: formData.get("badgeAr"),
    initial: formData.get("initial"),
    priceFromUsd: formData.get("priceFromUsd"),
    image: formData.get("image") || undefined,
    fulfillment: formData.get("fulfillment"),
    overviewEn: formData.get("overviewEn"),
    overviewAr: formData.get("overviewAr"),
    howToUseEn: formData.get("howToUseEn"),
    howToUseAr: formData.get("howToUseAr"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { id, priceFromUsd, image, ...rest } = parsed.data;
  await prisma.product.update({
    where: { id },
    data: { ...rest, priceFrom: cents(priceFromUsd), image: image || null },
  });
  revalidatePath(`/${locale}/admin/products/${id}`);
  return { ok: true, code: "saved" };
}

export async function deleteProduct(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  await prisma.product.delete({ where: { id } });
  redirect(`/${locale}/admin/products`);
}

// --- Packages (pricing) ----------------------------------------------------

const packageSchema = z.object({
  id: z.string().min(1),
  labelEn: z.string().trim().min(1).max(80),
  labelAr: z.string().trim().min(1).max(80),
  priceUsd: z.coerce.number().min(0).max(100000),
  popular: z.boolean(),
});

export async function updatePackage(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const parsed = packageSchema.safeParse({
    id: formData.get("id"),
    labelEn: formData.get("labelEn"),
    labelAr: formData.get("labelAr"),
    priceUsd: formData.get("priceUsd"),
    popular: formData.get("popular") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { id, priceUsd, ...rest } = parsed.data;
  await prisma.package.update({ where: { id }, data: { ...rest, price: cents(priceUsd) } });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/products`);
  return { ok: true, code: "saved" };
}

export async function addPackage(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const variantGroupId = String(formData.get("variantGroupId") ?? "");
  const group = await prisma.variantGroup.findUnique({
    where: { id: variantGroupId },
    include: { packages: true },
  });
  if (!group) return;
  await prisma.package.create({
    data: {
      variantGroupId,
      labelEn: "New package",
      labelAr: "باقة جديدة",
      price: 100,
      sortOrder: group.packages.length,
    },
  });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/products/${group.productId}`);
}

export async function deletePackage(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  await prisma.package.delete({ where: { id } });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/products/${productId}`);
}
