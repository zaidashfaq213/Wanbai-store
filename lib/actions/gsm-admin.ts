"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { imageToDataUrl, GSM_FILE_MAX_BYTES, GSM_FILE_ALLOWED } from "@/lib/upload";
import { notifyGsmOrderStatus } from "@/lib/gsm/notify";
import type { GsmOrderStatus } from "@prisma/client";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}
// Category/service/field CRUD stays ADMIN-only, same as the game catalog
// (lib/actions/catalog.ts) — but day-to-day order handling below accepts
// any staff member, same as lib/actions/payments.ts.
async function requireAdminUser() {
  const user = await getSessionUser();
  return user && user.role === "ADMIN" ? user : null;
}
async function requireStaffUser() {
  const user = await getSessionUser();
  return user && isStaff(user.role) ? user : null;
}
const cents = (usd: number) => Math.round(usd * 100);

export type GsmState = { ok: boolean; code?: string };

function revalidateGsmStorefront(locale: Locale) {
  revalidatePath(`/${locale}/gsm`, "layout");
  updateTag("gsm");
}

// --- Categories --------------------------------------------------------

const categorySchema = z.object({
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  nameEn: z.string().trim().min(1).max(60),
  nameAr: z.string().trim().min(1).max(60),
  icon: z.string().trim().min(1).max(8),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean(),
});

export async function createGsmCategory(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const parsed = categorySchema.safeParse({
    slug: formData.get("slug"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    icon: formData.get("icon") || "📱",
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  if (await prisma.gsmCategory.findUnique({ where: { slug: parsed.data.slug } })) {
    return { ok: false, code: "slug_taken" };
  }
  try {
    await prisma.gsmCategory.create({ data: parsed.data });
  } catch (err) {
    console.error("[createGsmCategory] failed:", err);
    return { ok: false, code: "server_error" };
  }
  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/admin/gsm/categories`);
  revalidateGsmStorefront(locale);
  return { ok: true, code: "saved" };
}

const categoryUpdateSchema = categorySchema.extend({ id: z.string().min(1) });

export async function updateGsmCategory(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const parsed = categoryUpdateSchema.safeParse({
    id: formData.get("id"),
    slug: formData.get("slug"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    icon: formData.get("icon") || "📱",
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { id, ...rest } = parsed.data;
  const dup = await prisma.gsmCategory.findFirst({ where: { slug: rest.slug, NOT: { id } } });
  if (dup) return { ok: false, code: "slug_taken" };
  try {
    await prisma.gsmCategory.update({ where: { id }, data: rest });
  } catch (err) {
    console.error("[updateGsmCategory] failed:", err);
    return { ok: false, code: "server_error" };
  }
  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/admin/gsm/categories`);
  revalidateGsmStorefront(locale);
  return { ok: true, code: "saved" };
}

export async function deleteGsmCategory(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  await prisma.gsmCategory.delete({ where: { id } });
  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/admin/gsm/categories`);
  revalidateGsmStorefront(locale);
}

// --- Services ------------------------------------------------------------

const serviceSchema = z.object({
  categoryId: z.string().min(1),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/),
  nameEn: z.string().trim().min(1).max(100),
  nameAr: z.string().trim().min(1).max(100),
  priceUsd: z.coerce.number().min(0).max(10_000_000),
  descriptionEn: z.string().trim().max(3000),
  descriptionAr: z.string().trim().max(3000),
  requirementsEn: z.string().trim().max(2000),
  requirementsAr: z.string().trim().max(2000),
  processingTimeEn: z.string().trim().max(80),
  processingTimeAr: z.string().trim().max(80),
  active: z.boolean(),
});

export async function createGsmService(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));
  const parsed = serviceSchema.safeParse({
    categoryId: formData.get("categoryId"),
    slug: formData.get("slug"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    priceUsd: formData.get("priceUsd"),
    descriptionEn: formData.get("descriptionEn") || "",
    descriptionAr: formData.get("descriptionAr") || "",
    requirementsEn: formData.get("requirementsEn") || "",
    requirementsAr: formData.get("requirementsAr") || "",
    processingTimeEn: formData.get("processingTimeEn") || "",
    processingTimeAr: formData.get("processingTimeAr") || "",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  if (await prisma.gsmService.findUnique({ where: { slug: parsed.data.slug } })) {
    return { ok: false, code: "slug_taken" };
  }
  const { priceUsd, ...rest } = parsed.data;
  let created;
  try {
    created = await prisma.gsmService.create({ data: { ...rest, price: cents(priceUsd) } });
  } catch (err) {
    console.error("[createGsmService] failed:", err);
    return { ok: false, code: "server_error" };
  }
  revalidatePath(`/${locale}/admin/gsm/services`);
  revalidateGsmStorefront(locale);
  redirect(`/${locale}/admin/gsm/services/${created.id}`);
}

const serviceUpdateSchema = serviceSchema.extend({ id: z.string().min(1) });

export async function updateGsmService(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));
  const parsed = serviceUpdateSchema.safeParse({
    id: formData.get("id"),
    categoryId: formData.get("categoryId"),
    slug: formData.get("slug"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    priceUsd: formData.get("priceUsd"),
    descriptionEn: formData.get("descriptionEn") || "",
    descriptionAr: formData.get("descriptionAr") || "",
    requirementsEn: formData.get("requirementsEn") || "",
    requirementsAr: formData.get("requirementsAr") || "",
    processingTimeEn: formData.get("processingTimeEn") || "",
    processingTimeAr: formData.get("processingTimeAr") || "",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { id, priceUsd, ...rest } = parsed.data;
  const dup = await prisma.gsmService.findFirst({ where: { slug: rest.slug, NOT: { id } } });
  if (dup) return { ok: false, code: "slug_taken" };
  try {
    await prisma.gsmService.update({ where: { id }, data: { ...rest, price: cents(priceUsd) } });
  } catch (err) {
    console.error("[updateGsmService] failed:", err);
    return { ok: false, code: "server_error" };
  }
  revalidatePath(`/${locale}/admin/gsm/services/${id}`);
  revalidatePath(`/${locale}/admin/gsm/services`);
  revalidateGsmStorefront(locale);
  return { ok: true, code: "saved" };
}

export async function deleteGsmService(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  await prisma.gsmService.delete({ where: { id } });
  revalidatePath(`/${locale}/admin/gsm/services`);
  revalidateGsmStorefront(locale);
  redirect(`/${locale}/admin/gsm/services`);
}

// --- Service fields (dynamic checkout fields, incl. file uploads) ----------

const fieldSchema = z.object({
  id: z.string().optional(),
  serviceId: z.string().min(1),
  key: z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_]+$/),
  labelEn: z.string().trim().min(1).max(80),
  labelAr: z.string().trim().min(1).max(80),
  placeholderEn: z.string().trim().max(120).optional(),
  placeholderAr: z.string().trim().max(120).optional(),
  kind: z.enum(["text", "number", "file"]).default("text"),
  required: z.boolean(),
});

export async function addGsmServiceField(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const parsed = fieldSchema.safeParse({
    serviceId: formData.get("serviceId"),
    key: formData.get("key"),
    labelEn: formData.get("labelEn"),
    labelAr: formData.get("labelAr"),
    placeholderEn: formData.get("placeholderEn") || undefined,
    placeholderAr: formData.get("placeholderAr") || undefined,
    kind: formData.get("kind") || "text",
    required: formData.get("required") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { serviceId, ...rest } = parsed.data;
  const existing = await prisma.gsmServiceField.findMany({ where: { serviceId } });
  if (existing.some((f) => f.key === rest.key)) return { ok: false, code: "key_taken" };
  try {
    await prisma.gsmServiceField.create({
      data: {
        serviceId,
        key: rest.key,
        labelEn: rest.labelEn,
        labelAr: rest.labelAr,
        placeholderEn: rest.placeholderEn ?? "",
        placeholderAr: rest.placeholderAr ?? "",
        kind: rest.kind,
        required: rest.required,
        sortOrder: existing.length,
      },
    });
  } catch {
    return { ok: false, code: "server_error" };
  }
  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/admin/gsm/services/${serviceId}`);
  revalidateGsmStorefront(locale);
  return { ok: true, code: "saved" };
}

export async function deleteGsmServiceField(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const id = String(formData.get("id") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  await prisma.gsmServiceField.delete({ where: { id } });
  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/admin/gsm/services/${serviceId}`);
  revalidateGsmStorefront(locale);
}

// --- Orders (staff, not admin-only — same as lib/actions/payments.ts) -----

const REFUNDABLE: GsmOrderStatus[] = ["REJECTED", "CANCELLED"];
// Forward-only workflow, mirrors the GSM spec's status pipeline. PENDING is
// never reachable from here (createGsmOrderForUser writes orders in as PAID).
// Exported so the order-detail page can render only the valid next steps.
export const GSM_ALLOWED_NEXT: Record<GsmOrderStatus, GsmOrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["UNDER_REVIEW", "IN_PROGRESS", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["IN_PROGRESS", "REJECTED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "REJECTED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export async function setGsmOrderStatus(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  const admin = await requireStaffUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const id = String(formData.get("id") ?? "");
  const nextStatus = String(formData.get("status") ?? "") as GsmOrderStatus;
  const locale = loc(String(formData.get("locale") ?? ""));

  const order = await prisma.gsmOrder.findUnique({ where: { id } });
  if (!order) return { ok: false, code: "not_found" };
  if (!GSM_ALLOWED_NEXT[order.status]?.includes(nextStatus)) {
    return { ok: false, code: "invalid_transition" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.gsmOrder.update({
        where: { id },
        data: { status: nextStatus, notifiedStatus: null },
      });
      if (REFUNDABLE.includes(nextStatus)) {
        await tx.user.update({
          where: { id: order.userId },
          data: { walletBalance: { increment: order.price } },
        });
        await tx.walletTransaction.create({
          data: {
            userId: order.userId,
            amount: order.price,
            type: "REFUND",
            description: `Refund for GSM order ${order.ref}`,
            orderId: null,
          },
        });
      }
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER",
          title: `GSM order ${order.ref} updated`,
          body:
            nextStatus === "COMPLETED"
              ? `${order.serviceName} is complete.`
              : REFUNDABLE.includes(nextStatus)
                ? `${order.serviceName} — refunded to your wallet.`
                : `${order.serviceName} — status updated.`,
          href: "/dashboard/gsm-orders",
        },
      });
    });
  } catch (err) {
    console.error("[setGsmOrderStatus] failed:", err);
    return { ok: false, code: "server_error" };
  }

  await notifyGsmOrderStatus(id, nextStatus);
  revalidatePath(`/${locale}/admin/gsm/orders`);
  revalidatePath(`/${locale}/admin/gsm/orders/${id}`);
  return { ok: true, code: "saved" };
}

export async function addGsmOrderNote(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  const admin = await requireStaffUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const orderId = String(formData.get("orderId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!orderId || !body) return { ok: false, code: "invalid_input" };

  const order = await prisma.gsmOrder.findUnique({ where: { id: orderId }, select: { userId: true, ref: true } });
  if (!order) return { ok: false, code: "not_found" };

  await prisma.$transaction([
    prisma.gsmOrderNote.create({
      data: { orderId, authorId: admin.id, isStaff: true, body },
    }),
    prisma.notification.create({
      data: {
        userId: order.userId,
        type: "ORDER",
        title: `New note on GSM order ${order.ref}`,
        body: body.slice(0, 140),
        href: "/dashboard/gsm-orders",
      },
    }),
  ]);

  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/admin/gsm/orders/${orderId}`);
  return { ok: true, code: "saved" };
}

export async function uploadGsmResultFile(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  const admin = await requireStaffUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.gsmOrder.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) return { ok: false, code: "not_found" };

  const file = formData.get("file");
  const uploaded = await imageToDataUrl(file, GSM_FILE_MAX_BYTES, GSM_FILE_ALLOWED);
  if (!uploaded.ok) return { ok: false, code: `file_${uploaded.error}` };
  const filename = file instanceof File ? file.name : "result";

  await prisma.gsmOrderFile.create({
    data: { orderId, data: uploaded.dataUrl, filename, source: "admin" },
  });

  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/admin/gsm/orders/${orderId}`);
  return { ok: true, code: "saved" };
}

export async function deleteGsmOrderFile(formData: FormData) {
  if (!(await requireStaffUser())) return;
  const id = String(formData.get("id") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  await prisma.gsmOrderFile.delete({ where: { id } });
  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/admin/gsm/orders/${orderId}`);
}
