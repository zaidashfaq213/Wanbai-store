import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, withAuth } from "@/lib/api/core";

// GET /api/v1/orders — the caller's orders
export const GET = withAuth(async (_req, user) => {
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      paymentSubmissions: {
        select: { status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      // Unread admin replies, so the app can badge the row.
      _count: {
        select: { messages: { where: { isStaff: true, readByUser: false } } },
      },
    },
  });
  return ok({ orders });
});

// Buying a service is wallet-only — bank transfer per order was removed so
// every purchase settles instantly against a balance already verified via the
// wallet top-up review. Bank transfer still exists only to FUND the wallet
// (POST /wallet/topup), not to pay for an order directly.
const createSchema = z.object({
  currency: z.string().default("USD"),
  locale: z.string().default("ar"),
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

// POST /api/v1/orders — buy with wallet balance (instant debit)
export const POST = withAuth(async (req, user) => {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");
  const { currency, locale, item } = parsed.data;

  const unitPrice = Math.round(item.unitPriceUsd * 100);
  const total = unitPrice;
  const ref = `WB-${randomBytes(4).toString("hex").toUpperCase()}`;

  const itemData = {
    productSlug: item.productSlug,
    productName: item.productName,
    categorySlug: item.categorySlug,
    variantLabel: item.variantLabel,
    packageLabel: item.packageLabel,
    unitPrice,
    quantity: 1,
    deliveryType: item.deliveryType,
    inputs: item.inputs ?? undefined,
  };

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { walletBalance: true },
  });
  if (!fresh || fresh.walletBalance < total) return fail("insufficient_funds", 402);

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
        items: { create: itemData },
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
  return ok({ order, status: "order_paid" }, 201);
});
