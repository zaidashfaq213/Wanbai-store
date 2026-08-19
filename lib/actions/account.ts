"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";

function loc(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

// --- Favorites -------------------------------------------------------------

export type ToggleFavoriteResult = {
  ok: boolean;
  favorited?: boolean;
  requiresAuth?: boolean;
};

/** Toggle a product in the current user's wishlist. Guests get requiresAuth. */
export async function toggleFavorite(
  productSlug: string,
): Promise<ToggleFavoriteResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, requiresAuth: true };

  const existing = await prisma.favorite.findUnique({
    where: { userId_productSlug: { userId: user.id, productSlug } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, productSlug } });
  }

  revalidatePath("/[lang]/dashboard/favorites", "page");
  return { ok: true, favorited: !existing };
}

export async function removeFavorite(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const productSlug = String(formData.get("productSlug") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  await prisma.favorite.deleteMany({
    where: { userId: user.id, productSlug },
  });
  revalidatePath(`/${locale}/dashboard/favorites`);
}

// --- Notifications ---------------------------------------------------------

export async function markAllNotificationsRead(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const locale = loc(String(formData.get("locale") ?? ""));
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath(`/${locale}/dashboard/notifications`);
}

export async function markNotificationRead(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  revalidatePath(`/${locale}/dashboard/notifications`);
}

// --- Profile ---------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  preferredLocale: z.string().optional(),
  preferredCurrency: z.string().optional(),
});

export type FormState = { ok: boolean; code?: string };

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    preferredLocale: formData.get("preferredLocale") || undefined,
    preferredCurrency: formData.get("preferredCurrency") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  // The session id may point to a user that no longer exists (e.g. the DB was
  // reseeded after login). Guard so it returns a clean "please sign in again"
  // instead of a 500 that shows "A server error occurred".
  const exists = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });
  if (!exists) return { ok: false, code: "requires_auth" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      preferredLocale: parsed.data.preferredLocale,
      preferredCurrency: parsed.data.preferredCurrency,
    },
  });

  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/dashboard/profile`);
  return { ok: true, code: "profile_saved" };
}

// --- Change password --------------------------------------------------------
// Used by both the dashboard profile page and the admin "My account" page —
// any logged-in user (customer, Manager or Supervisor) can set their own new
// password here, as long as they can prove the current one.

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
  });

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.path[0];
    if (issue === "confirmPassword") return { ok: false, code: "mismatch" };
    if (issue === "newPassword") return { ok: false, code: "weak_password" };
    return { ok: false, code: "invalid_input" };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return { ok: false, code: "requires_auth" };

  // OAuth-only accounts have no password to check against — block here
  // rather than silently letting anyone set one without proving identity.
  if (!record.passwordHash) return { ok: false, code: "no_password" };

  const match = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
  if (!match) return { ok: false, code: "wrong_current" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { ok: true, code: "password_changed" };
}
