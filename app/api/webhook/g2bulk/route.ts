import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { orderDeliveredEmail } from "@/lib/emails/order-delivered";
import { refundFailedTopUp } from "@/lib/gameapi/refund";
import { notifyUser } from "@/lib/notify";

// G2Bulk POSTs here when a top-up reaches a terminal state (COMPLETED or
// FAILED). No signature mechanism exists on their side (confirmed against
// their docs), so authenticity is verified with our own unguessable token —
// embedded as a query param on the callback_url we hand them when the order
// is created (see lib/gameapi/order.ts) — cross-checked against the
// provider's order_id for that same GameApiOrder row.
//
// Must respond 2xx within 10s; they retry once on failure, so this has to be
// idempotent against a duplicate delivery of the same payload.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");
  if (!token) return new Response("missing token", { status: 400 });

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const gameOrder = await prisma.gameApiOrder.findUnique({
    where: { webhookToken: token },
    include: { orderItem: { include: { order: true } } },
  });
  if (!gameOrder) return new Response("unknown token", { status: 404 });

  if (
    gameOrder.providerOrderId != null &&
    String(payload.order_id) !== String(gameOrder.providerOrderId)
  ) {
    return new Response("order_id mismatch", { status: 400 });
  }

  // Already resolved (e.g. this is the provider's one automatic retry) —
  // acknowledge without doing anything again.
  if (gameOrder.status === "COMPLETED" || gameOrder.status === "FAILED") {
    return Response.json({ ok: true, alreadyProcessed: true });
  }

  const status = String(payload.status ?? "").toUpperCase();
  await prisma.gameApiOrder.update({
    where: { id: gameOrder.id },
    data: { status, raw: payload as object },
  });

  const { orderItem } = gameOrder;
  const { order } = orderItem;

  if (status === "COMPLETED") {
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.update({
        where: { id: orderItem.id },
        data: { deliveredAt: new Date() },
      });
      // notifiedStatus set here too — the email right below already covers
      // "completed", so the generic notifyOrderStatus() won't send a second.
      await tx.order.update({
        where: { id: order.id },
        data: { status: "DELIVERED", notifiedStatus: "DELIVERED" },
      });
      if (order.userId) {
        await tx.notification.create({
          data: {
            userId: order.userId,
            type: "ORDER",
            title: `Order ${order.ref} delivered`,
            body: "Your top-up has been completed.",
            href: "/dashboard/orders",
          },
        });
      }
    });
    if (order.userId) {
      void notifyUser(order.userId, {
        title: `Order ${order.ref} delivered`,
        body: "Your top-up has been completed.",
        href: "/dashboard/orders",
      });
    }

    await sendMail({
      to: order.email,
      ...orderDeliveredEmail({
        locale: order.locale,
        ref: order.ref,
        productName: orderItem.productName,
        packageLabel: orderItem.packageLabel,
      }),
    }).catch(() => {});
  } else if (status === "FAILED") {
    const reason = typeof payload.message === "string" ? payload.message : "Top-up failed";
    await refundFailedTopUp(order.id, reason);
  }
  // PENDING / PROCESSING — the status update above is all there is to do.

  return Response.json({ ok: true });
}
