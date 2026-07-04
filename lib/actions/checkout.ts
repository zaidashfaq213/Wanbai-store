"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

// One purchasable line coming from the product purchase panel. Prices arrive in
// USD dollars and are stored as integer cents.
const checkoutSchema = z.object({
  locale: z.string(),
  currency: z.string().default("USD"),
  email: z.string().trim().toLowerCase().email().optional(),
  paymentMethod: z.enum(["WALLET", "GATEWAY"]),
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
  redirect?: string;
};

function orderRef() {
  return `WB-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Mock fulfillment — the real delivery engine + supplier APIs land in M4. */
function fulfill(deliveryType: "TOPUP" | "CODE" | "SERVICE") {
  if (deliveryType === "CODE") {
    const seg = () => randomBytes(2).toString("hex").toUpperCase();
    return `${seg()}-${seg()}-${seg()}-${seg()}`;
  }
  return null; // top-ups / services are marked delivered without a code
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { locale, currency, paymentMethod, item } = parsed.data;

  const user = await getSessionUser();
  const email = user?.email ?? parsed.data.email;
  if (!email) return { ok: false, code: "email_required" };

  const unitPrice = Math.round(item.unitPriceUsd * 100);
  const total = unitPrice; // single item, quantity 1

  const ref = orderRef();

  // --- Wallet checkout: pay + deliver immediately ---
  if (paymentMethod === "WALLET") {
    if (!user) return { ok: false, code: "requires_auth" };

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { walletBalance: true },
    });
    if (!dbUser || dbUser.walletBalance < total) {
      return { ok: false, code: "insufficient_funds" };
    }

    const deliveredCode = fulfill(item.deliveryType);
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          ref,
          userId: user.id,
          email,
          status: "DELIVERED",
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
              deliveredCode,
              deliveredAt: new Date(),
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
          title: `Order ${ref} delivered`,
          body: `${item.productName} — ${item.packageLabel}`,
          href: "/dashboard/orders",
        },
      });
      return created;
    });

    return { ok: true, code: "order_delivered", orderRef: order.ref };
  }

  // --- Gateway checkout: create a pending order (payment captured in M4) ---
  const order = await prisma.order.create({
    data: {
      ref,
      userId: user?.id ?? null,
      email,
      status: "PENDING",
      paymentMethod: "GATEWAY",
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

  if (user) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "ORDER",
        title: `Order ${ref} created`,
        body: "Awaiting payment.",
        href: "/dashboard/orders",
      },
    });
  }

  return { ok: true, code: "order_pending", orderRef: order.ref };
}
