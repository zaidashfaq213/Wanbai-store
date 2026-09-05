import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { attemptAutoTopUp } from "@/lib/gameapi/order";
import { refundFailedTopUp } from "@/lib/gameapi/refund";
import { notifyOrderStatus } from "./notify";
import { notifyNewOrder } from "@/lib/telegram";

// Single source of truth for "buy with wallet balance" — used by BOTH the
// web checkout (lib/actions/checkout.ts) and the mobile REST API
// (app/api/v1/orders/route.ts). They used to duplicate this logic, which is
// exactly how the "order received" email and the Game API auto-fulfilment
// silently never ran for mobile orders — fixed by having both call this.

export type CreateOrderItemInput = {
  productSlug: string;
  productName: string;
  categorySlug: string;
  variantLabel?: string;
  packageLabel: string;
  unitPriceUsd: number;
  deliveryType: "TOPUP" | "CODE" | "SERVICE";
  inputs?: Record<string, string>;
  // The live Package id — used only to look up a Game API auto-fulfilment
  // mapping. Never stored on the order itself, which stays a label/price
  // snapshot so catalog edits don't rewrite history.
  packageId?: string;
};

export type CreateOrderResult = {
  ok: boolean;
  code: string; // "order_paid" | "insufficient_funds" | "topup_failed" | ...
  orderRef?: string;
};

export async function createOrderForUser(
  user: { id: string; email: string },
  input: { locale: string; currency: string; item: CreateOrderItemInput },
): Promise<CreateOrderResult> {
  const { locale, currency, item } = input;
  const unitPrice = Math.round(item.unitPriceUsd * 100);
  const total = unitPrice; // single item, quantity 1

  // Defense in depth: the storefront already disables the buy button for an
  // unavailable product (Admin → Products), but that's UI-only — a direct
  // POST to /api/v1/orders (or the web action called with a stale page open)
  // must be rejected here too.
  const product = await prisma.product.findUnique({
    where: { slug: item.productSlug },
    select: { available: true },
  });
  if (product && !product.available) {
    return { ok: false, code: "product_unavailable" };
  }

  // Same defense in depth for the package-level toggle — a specific
  // denomination/tier can be turned off while the rest of the product stays
  // purchasable, so this needs its own check (item.packageId is already
  // sent by every client for exactly this kind of lookup).
  if (item.packageId) {
    const pkg = await prisma.package.findUnique({
      where: { id: item.packageId },
      select: { available: true },
    });
    if (pkg && !pkg.available) {
      return { ok: false, code: "package_unavailable" };
    }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { walletBalance: true },
  });
  if (!dbUser || dbUser.walletBalance < total) {
    return { ok: false, code: "insufficient_funds" };
  }

  const ref = `WB-${randomBytes(4).toString("hex").toUpperCase()}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        ref,
        userId: user.id,
        email: user.email,
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

  // "Your order has been received" — every order, the moment it's created.
  await notifyOrderStatus(order.id, "PAID");
  // Fire-and-forget — notifyAdminTelegram already swallows its own errors,
  // so this never blocks/fails the order over a Telegram hiccup.
  void notifyNewOrder({
    ref: order.ref,
    productName: item.productName,
    packageLabel: item.packageLabel,
    totalCents: total,
    email: user.email,
  });

  // Auto-fulfilment: only kicks in when this exact package is mapped to a
  // Game API catalogue entry (Admin → Game API). Every other product falls
  // through untouched — an admin delivers it by hand, exactly as before.
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
  } else if (item.deliveryType === "TOPUP") {
    // The other blind spot: a TOPUP item whose client request never included
    // a packageId at all (stale/cached page, a client bug) never even calls
    // attemptAutoTopUp — falls through to manual fulfilment with zero trace.
    console.warn(`[createOrderForUser] order ${ref} is TOPUP but has no packageId — auto top-up was never attempted (product: ${item.productSlug})`);
  }

  return { ok: true, code: "order_paid", orderRef: order.ref };
}
