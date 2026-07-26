"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

// One purchasable line coming from the product purchase panel. Prices arrive in
// USD dollars and are stored as integer cents.
//
// Buying a service is wallet-only — bank transfer per order was removed so
// every purchase settles instantly against a balance we've already verified
// (via the wallet top-up review). Bank transfer still exists, but only to
// FUND the wallet (see lib/actions/payments.ts submitWalletTopUp).
const checkoutSchema = z.object({
  locale: z.string(),
  currency: z.string().default("USD"),
  item: z.object({
    productSlug: z.string().min(1),
    productName: z.string().min(1),
    categorySlug: z.string().min(1),
    variantLabel: z.string().optional(),
    packageLabel: z.string().min(1),
    unitPriceUsd: z.number().nonnegative(),
    deliveryType: z.enum(["TOPUP", "CODE", "SERVICE"]),
    inputs: z.record(z.string(), z.string()).optional(),
  }),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

export type CheckoutResult = {
  ok: boolean;
  code?: string; // localizable message key
  orderRef?: string;
};

function orderRef() {
  return `WB-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { locale, currency, item } = parsed.data;

  const user = await getSessionUser();
  if (!user?.email) return { ok: false, code: "requires_auth" };
  const userId = user.id;
  const email = user.email;

  const unitPrice = Math.round(item.unitPriceUsd * 100);
  const total = unitPrice; // single item, quantity 1

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });
  if (!dbUser || dbUser.walletBalance < total) {
    return { ok: false, code: "insufficient_funds" };
  }

  const ref = orderRef();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        ref,
        userId,
        email,
        status: "PAID",
        paymentMethod: "WALLET",
        subtotal: total,
        total,
        currency,
        locale,
        items: {
          create: {
            productSlug: item.productSlug,
            productName: item.productName,
            categorySlug: item.categorySlug,
            variantLabel: item.variantLabel,
            packageLabel: item.packageLabel,
            unitPrice,
            quantity: 1,
            deliveryType: item.deliveryType,
            inputs: item.inputs ?? undefined,
          },
        },
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { walletBalance: { decrement: total } },
    });
    await tx.walletTransaction.create({
      data: {
        userId: user.id,
        amount: -total,
        type: "PURCHASE",
        description: `Order ${ref}`,
        orderId: created.id,
      },
    });
    await tx.notification.create({
      data: {
        userId: user.id,
        type: "ORDER",
        title: `Order ${ref} paid`,
        body: `${item.productName} — ${item.packageLabel}. We're preparing it now.`,
        href: "/dashboard/orders",
      },
    });
    return created;
  });

  return { ok: true, code: "order_paid", orderRef: order.ref };
}
