import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, withAuth } from "@/lib/api/core";
import { createOrderForUser } from "@/lib/orders/create";

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

// Buying is wallet-only (see lib/orders/create.ts for the full flow — order
// creation, the "received" email, and Game API auto-fulfilment when the
// package is mapped).
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
    // The live Package id — used only to look up a Game API auto-fulfilment
    // mapping. Never stored on the order itself.
    packageId: z.string().optional(),
  }),
});

// POST /api/v1/orders — buy with wallet balance (instant debit)
export const POST = withAuth(async (req, user) => {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");
  const { currency, locale, item } = parsed.data;

  const result = await createOrderForUser(
    { id: user.id, email: user.email },
    { locale, currency, item },
  );
  if (!result.ok) {
    return fail(
      result.code,
      result.code === "insufficient_funds" ? 402 : 400,
      result.orderRef ? { orderRef: result.orderRef } : undefined,
    );
  }

  const order = await prisma.order.findUnique({
    where: { ref: result.orderRef },
    include: { items: true },
  });
  return ok({ order, status: result.code }, 201);
});
