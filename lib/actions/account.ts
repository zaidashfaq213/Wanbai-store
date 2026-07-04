"use server";

import { revalidatePath } from "next/cache";
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

// --- Wallet top-up (mock; real payment gateway arrives in M4) ---------------

export type TopUpState = { ok: boolean; code?: string };

const topUpSchema = z.object({
  amountUsd: z.coerce.number().min(1).max(1000),
});

export async function topUpWallet(
  _prev: TopUpState,
  formData: FormData,
): Promise<TopUpState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };

  const parsed = topUpSchema.safeParse({ amountUsd: formData.get("amountUsd") });
  if (!parsed.success) return { ok: false, code: "invalid_amount" };

  const cents = Math.round(parsed.data.amountUsd * 100);
  const locale = loc(String(formData.get("locale") ?? ""));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { walletBalance: { increment: cents } },
    }),
    prisma.walletTransaction.create({
      data: {
        userId: user.id,
        amount: cents,
        type: "TOPUP",
        description: "Wallet top-up",
      },
    }),
    prisma.notification.create({
      data: {
        userId: user.id,
        type: "WALLET",
        title: "Wallet topped up",
        body: `$${parsed.data.amountUsd.toFixed(2)} added to your wallet.`,
        href: "/dashboard/wallet",
      },
    }),
  ]);

  revalidatePath(`/${locale}/dashboard/wallet`);
  return { ok: true, code: "topup_success" };
}
