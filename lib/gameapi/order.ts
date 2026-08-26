import "server-only";
import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { createTopUpOrder, G2BulkError, isConfigured } from "./client";

export type TopUpAttempt =
  | { attempted: false }
  | { attempted: true; ok: true }
  | { attempted: true; ok: false; reason: string };

/**
 * Called right after a wallet-paid order is created (see
 * lib/actions/checkout.ts). If the purchased package is mapped to a provider
 * catalogue entry (see the Game API admin page), places the top-up order with
 * G2Bulk and records a GameApiOrder row to track it through the webhook.
 *
 * Returns { attempted: false } when there's no mapping (or the integration is
 * off) — the item just falls back to normal manual admin fulfilment, exactly
 * like every other product on the store.
 */
export async function attemptAutoTopUp(input: {
  orderItemId: string;
  packageId: string;
  orderRef: string;
  playerId?: string;
  serverId?: string;
  charname?: string;
}): Promise<TopUpAttempt> {
  if (!isConfigured()) return { attempted: false };

  const settings = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  if (!settings?.gameApiEnabled) return { attempted: false };

  const mapping = await prisma.gameApiCatalogue.findUnique({
    where: { packageId: input.packageId },
    include: { game: true },
  });
  if (!mapping || !mapping.game.active) return { attempted: false };

  // The package IS mapped for auto top-up, so from here on a failure must be
  // reported (and refunded) — never silently fall back to manual delivery,
  // or the customer would be stuck expecting an automatic top-up that no one
  // will ever manually action.
  if (!input.playerId) {
    return { attempted: true, ok: false, reason: "Missing Player ID" };
  }

  const token = randomBytes(24).toString("hex");
  const callbackUrl = `${SITE_URL}/api/webhook/g2bulk?t=${token}`;

  try {
    const res = await createTopUpOrder(
      mapping.game.code,
      {
        catalogue_name: mapping.name,
        player_id: input.playerId,
        server_id: input.serverId || undefined,
        charname: input.charname || undefined,
        remark: input.orderRef,
        callback_url: callbackUrl,
      },
      randomUUID(),
    );

    await prisma.gameApiOrder.create({
      data: {
        orderItemId: input.orderItemId,
        providerOrderId: res.order.order_id,
        gameCode: mapping.game.code,
        catalogueName: mapping.name,
        status: (res.order.status || "PENDING").toUpperCase(),
        webhookToken: token,
        raw: res as unknown as object,
      },
    });
    return { attempted: true, ok: true };
  } catch (e) {
    const message = e instanceof G2BulkError ? e.message : "Provider request failed";
    await prisma.gameApiOrder
      .create({
        data: {
          orderItemId: input.orderItemId,
          gameCode: mapping.game.code,
          catalogueName: mapping.name,
          status: "FAILED",
          webhookToken: token,
          errorMessage: message,
        },
      })
      .catch(() => {});
    return { attempted: true, ok: false, reason: message };
  }
}
