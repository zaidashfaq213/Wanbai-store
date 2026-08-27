"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createOrderForUser } from "@/lib/orders/create";

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

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { locale, currency, item } = parsed.data;

  const user = await getSessionUser();
  if (!user?.email) return { ok: false, code: "requires_auth" };

  return createOrderForUser({ id: user.id, email: user.email }, { locale, currency, item });
}
