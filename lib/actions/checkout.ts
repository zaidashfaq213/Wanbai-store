"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { attemptAutoTopUp } from "@/lib/gameapi/order";
import { refundFailedTopUp } from "@/lib/gameapi/refund";
import { notifyOrderStatus } from "@/lib/orders/notify";

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
    // The live Package id — used only to look up a Game API auto-fulfilment
    // mapping (lib/gameapi/order.ts). Never stored on the order itself, which
    // stays a label/price snapshot so catalog edits don't rewrite history.
    packageId: z.string().optional(),
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
      include: { items: true },
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

  // "Your order has been received" — sent for every order the moment it's
  // created, before any fulfilment (manual or automatic) happens. Awaited
  // (like every other order email in this codebase) so the notifiedStatus
  // write can't race with the auto-fulfilment attempt just below.
  await notifyOrderStatus(order.id, "PAID");

  // Auto-fulfilment: only kicks in when this exact package is mapped to a
  // Game API catalogue entry (Admin → Game API). Every other product falls
  // through untouched, exactly as before — an admin delivers it by hand.
  if (item.deliveryType === "TOPUP" && item.packageId) {
    const orderItem = order.items[0];
    const attempt = await attemptAutoTopUp({
      orderItemId: orderItem.id,
      packageId: item.packageId,
      orderRef: order.ref,
      playerId: item.inputs?.playerId,
      serverId: item.inputs?.server,
      charname: item.inputs?.charname,
    });
    if (attempt.attempted && !attempt.ok) {
      await refundFailedTopUp(order.id, attempt.reason);
      return { ok: false, code: "topup_failed", orderRef: order.ref };
    }
  }

  return { ok: true, code: "order_paid", orderRef: order.ref };
}
