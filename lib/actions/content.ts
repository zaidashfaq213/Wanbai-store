"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hasPurchased, hasReviewed } from "@/lib/data/content";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { imageToDataUrl, FAVICON_ALLOWED, BRANDING_MAX_BYTES } from "@/lib/upload";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}
async function requireAdminUser() {
  const u = await getSessionUser();
  return u && u.role === "ADMIN" ? u : null;
}

export type ContentState = { ok: boolean; code?: string };

// --- CMS pages -------------------------------------------------------------

const pageSchema = z.object({
  id: z.string().optional(),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/),
  titleEn: z.string().trim().min(1).max(120),
  titleAr: z.string().trim().min(1).max(120),
  bodyEn: z.string().trim().max(20000),
  bodyAr: z.string().trim().max(20000),
  published: z.boolean(),
});

export async function savePage(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));
  const parsed = pageSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    titleEn: formData.get("titleEn"),
    titleAr: formData.get("titleAr"),
    bodyEn: formData.get("bodyEn"),
    bodyAr: formData.get("bodyAr"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { id, ...data } = parsed.data;

  if (id) {
    await prisma.page.update({ where: { id }, data });
  } else {
    const exists = await prisma.page.findUnique({ where: { slug: data.slug } });
    if (exists) return { ok: false, code: "slug_taken" };
    await prisma.page.create({ data });
  }
  revalidatePath(`/${locale}/admin/pages`);
  revalidatePath(`/${locale}/pages/${data.slug}`);
  return { ok: true, code: "saved" };
}

export async function deletePage(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  await prisma.page.delete({ where: { id } });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/pages`);
}

// --- Blog ------------------------------------------------------------------

const postSchema = z.object({
  id: z.string().optional(),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  titleEn: z.string().trim().min(1).max(160),
  titleAr: z.string().trim().min(1).max(160),
  excerptEn: z.string().trim().max(300),
  excerptAr: z.string().trim().max(300),
  bodyEn: z.string().trim().max(30000),
  bodyAr: z.string().trim().max(30000),
  coverImage: z.string().trim().max(300).optional(),
  published: z.boolean(),
});

export async function savePost(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));
  const parsed = postSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    titleEn: formData.get("titleEn"),
    titleAr: formData.get("titleAr"),
    excerptEn: formData.get("excerptEn"),
    excerptAr: formData.get("excerptAr"),
    bodyEn: formData.get("bodyEn"),
    bodyAr: formData.get("bodyAr"),
    coverImage: formData.get("coverImage") || undefined,
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { id, coverImage, ...rest } = parsed.data;
  const data = { ...rest, coverImage: coverImage || null };

  if (id) {
    await prisma.post.update({ where: { id }, data });
  } else {
    const exists = await prisma.post.findUnique({ where: { slug: data.slug } });
    if (exists) return { ok: false, code: "slug_taken" };
    await prisma.post.create({ data });
  }
  revalidatePath(`/${locale}/admin/blog`);
  revalidatePath(`/${locale}/blog`);
  return { ok: true, code: "saved" };
}

export async function deletePost(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  await prisma.post.delete({ where: { id } });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/blog`);
}

// --- Help FAQs -------------------------------------------------------------

const faqSchema = z.object({
  id: z.string().optional(),
  categoryKey: z.string().trim().min(1).max(40),
  qEn: z.string().trim().min(1).max(200),
  qAr: z.string().trim().min(1).max(200),
  aEn: z.string().trim().max(2000),
  aAr: z.string().trim().max(2000),
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveFaq(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));
  const parsed = faqSchema.safeParse({
    id: formData.get("id") || undefined,
    categoryKey: formData.get("categoryKey"),
    qEn: formData.get("qEn"),
    qAr: formData.get("qAr"),
    aEn: formData.get("aEn"),
    aAr: formData.get("aAr"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { id, ...data } = parsed.data;

  if (id) await prisma.helpFaq.update({ where: { id }, data });
  else await prisma.helpFaq.create({ data });

  revalidatePath(`/${locale}/admin/faqs`);
  revalidatePath(`/${locale}/help`);
  return { ok: true, code: "saved" };
}

export async function deleteFaq(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  await prisma.helpFaq.delete({ where: { id } });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/faqs`);
}

// --- Store settings --------------------------------------------------------

const settingsSchema = z.object({
  whatsapp: z.string().trim().max(60).optional(),
  telegram: z.string().trim().max(60).optional(),
  supportEmail: z.string().trim().max(120).optional(),
  facebook: z.string().trim().max(200).optional(),
  instagram: z.string().trim().max(200).optional(),
  youtube: z.string().trim().max(200).optional(),
  tiktok: z.string().trim().max(200).optional(),
});

export async function saveSettings(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const parsed = settingsSchema.safeParse({
    whatsapp: formData.get("whatsapp") || undefined,
    telegram: formData.get("telegram") || undefined,
    supportEmail: formData.get("supportEmail") || undefined,
    facebook: formData.get("facebook") || undefined,
    instagram: formData.get("instagram") || undefined,
    youtube: formData.get("youtube") || undefined,
    tiktok: formData.get("tiktok") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  // Logo / favicon: upload a new file, keep the current one, or clear it.
  let logo: string | null | undefined; // undefined = leave unchanged
  if (formData.get("removeLogo") === "on") {
    logo = null;
  } else {
    const file = formData.get("logo");
    if (file instanceof File && file.size > 0) {
      const upload = await imageToDataUrl(file, BRANDING_MAX_BYTES);
      if (!upload.ok) return { ok: false, code: `logo_${upload.error}` };
      logo = upload.dataUrl;
    }
  }

  let favicon: string | null | undefined;
  if (formData.get("removeFavicon") === "on") {
    favicon = null;
  } else {
    const file = formData.get("favicon");
    if (file instanceof File && file.size > 0) {
      const upload = await imageToDataUrl(file, BRANDING_MAX_BYTES, FAVICON_ALLOWED);
      if (!upload.ok) return { ok: false, code: `favicon_${upload.error}` };
      favicon = upload.dataUrl;
    }
  }

  const data = {
    ...parsed.data,
    ...(logo !== undefined ? { logo } : {}),
    ...(favicon !== undefined ? { favicon } : {}),
  };
  try {
    await prisma.storeSettings.upsert({
      where: { id: "store" },
      update: data,
      create: { id: "store", ...data },
    });
  } catch {
    return { ok: false, code: "server_error" };
  }
  // The logo/favicon show in every storefront/admin layout, so refresh broadly.
  revalidatePath("/", "layout");
  return { ok: true, code: "saved" };
}

// --- Game/product API integration (staged — not wired into any live flow
// yet; a provider hasn't been chosen). Kept separate from saveSettings above
// so editing credentials never touches the contact/social fields.
// -----------------------------------------------------------------------

const apiSettingsSchema = z.object({
  gameApiEnabled: z.boolean(),
  gameApiBaseUrl: z.string().trim().max(300).optional(),
  gameApiKey: z.string().trim().max(300).optional(),
  gameApiSecret: z.string().trim().max(2000).optional(),
});

export async function saveApiSettings(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const parsed = apiSettingsSchema.safeParse({
    gameApiEnabled: formData.get("gameApiEnabled") === "on",
    gameApiBaseUrl: formData.get("gameApiBaseUrl") || undefined,
    gameApiKey: formData.get("gameApiKey") || undefined,
    gameApiSecret: formData.get("gameApiSecret") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  // Leave the secret untouched if the field was left blank on save (so the
  // admin doesn't have to re-paste it every time they tweak the base URL).
  const { gameApiSecret, ...rest } = parsed.data;
  const data = {
    ...rest,
    ...(gameApiSecret ? { gameApiSecret } : {}),
  };
  try {
    await prisma.storeSettings.upsert({
      where: { id: "store" },
      update: data,
      create: { id: "store", ...data },
    });
  } catch {
    return { ok: false, code: "server_error" };
  }
  return { ok: true, code: "saved" };
}

// --- Product reviews -------------------------------------------------------

const reviewSchema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(600),
});

export async function submitReview(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    productSlug: formData.get("productSlug"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  // Only verified purchasers may review, and only once per product.
  if (!(await hasPurchased(user.id, parsed.data.productSlug))) {
    return { ok: false, code: "not_purchased" };
  }
  if (await hasReviewed(user.id, parsed.data.productId)) {
    return { ok: false, code: "already_reviewed" };
  }

  const comment = parsed.data.comment;
  await prisma.productReview.create({
    data: {
      productId: parsed.data.productId,
      userId: user.id,
      name: user.name ?? "Customer",
      rating: parsed.data.rating,
      commentEn: comment,
      commentAr: comment,
      date: new Date().toISOString().slice(0, 10),
    },
  });

  // Keep the product's headline rating/count in sync.
  const agg = await prisma.productReview.aggregate({
    where: { productId: parsed.data.productId, approved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: {
      rating: Math.round((agg._avg.rating ?? 5) * 10) / 10,
      reviewCount: typeof agg._count === "number" ? agg._count : 0,
    },
  });

  revalidatePath(`/${locale}/product/${parsed.data.productSlug}`);
  return { ok: true, code: "review_saved" };
}

export async function deleteReview(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  await prisma.productReview.delete({ where: { id } });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/reviews`);
}

export async function toggleReviewApproval(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  const review = await prisma.productReview.findUnique({ where: { id } });
  if (!review) return;
  await prisma.productReview.update({
    where: { id },
    data: { approved: !review.approved },
  });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/reviews`);
}

// --- Re-engagement ("come back") email settings -----------------------------

const reEngagementSchema = z.object({
  enabled: z.boolean(),
  inactiveDays: z.coerce.number().int().min(1).max(365),
  maxSends: z.coerce.number().int().min(1).max(20),
  intervalDays: z.coerce.number().int().min(1).max(365),
  subjectEn: z.string().trim().min(1).max(150),
  subjectAr: z.string().trim().min(1).max(150),
  bodyEn: z.string().trim().min(1).max(500),
  bodyAr: z.string().trim().min(1).max(500),
});

export async function saveReEngagementSettings(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const parsed = reEngagementSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    inactiveDays: formData.get("inactiveDays"),
    maxSends: formData.get("maxSends"),
    intervalDays: formData.get("intervalDays"),
    subjectEn: formData.get("subjectEn"),
    subjectAr: formData.get("subjectAr"),
    bodyEn: formData.get("bodyEn"),
    bodyAr: formData.get("bodyAr"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  try {
    await prisma.reEngagementSettings.upsert({
      where: { id: "reengagement" },
      update: parsed.data,
      create: { id: "reengagement", ...parsed.data },
    });
  } catch {
    return { ok: false, code: "server_error" };
  }
  return { ok: true, code: "saved" };
}
