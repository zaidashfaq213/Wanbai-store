import "server-only";
import { prisma } from "@/lib/db";
import { notifyOrderStatus } from "@/lib/orders/notify";
import { notifyUser } from "@/lib/notify";

/**
 * The customer already paid (wallet was decremented at checkout) but the
 * provider top-up could not be completed — either it failed immediately at
 * order-creation, or the webhook later reported a terminal FAILED. Either
 * way: give the money back and mark the order REFUNDED, exactly like an
 * admin-initiated refund (lib/actions/payments.ts refundOrder).
 *
 * Idempotent — safe to call twice for the same order (e.g. a duplicate
 * webhook retry).
 */
export async function refundFailedTopUp(orderId: string, reason: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === "REFUNDED") return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
    if (order.userId) {
      await tx.user.update({
        where: { id: order.userId },
        data: { walletBalance: { increment: order.total } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: order.userId,
          amount: order.total,
          type: "REFUND",
          description: `Refund for order ${order.ref} — top-up failed (${reason})`,
          orderId: order.id,
        },
      });
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "WALLET",
          title: `Order ${order.ref} could not be completed`,
          body: `The top-up failed (${reason}). ${(order.total / 100).toFixed(2)} ج.س was added back to your wallet.`,
          href: "/dashboard/wallet",
        },
      });
    }
  });

  await notifyOrderStatus(orderId, "REFUNDED");
  if (order.userId) {
    void notifyUser(order.userId, {
      title: `Order ${order.ref} could not be completed`,
      body: `The top-up failed (${reason}). ${(order.total / 100).toFixed(2)} ج.س was added back to your wallet.`,
      href: "/dashboard/wallet",
    });
  }
}
