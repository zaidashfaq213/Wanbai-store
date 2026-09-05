import "server-only";
import { prisma } from "@/lib/db";
import { sendExpoPush } from "@/lib/push";

/**
 * Push notification companion to an in-app Notification row. Called AFTER
 * the row is written (often inside a $transaction — tx.notification.create),
 * the same way notifyOrderStatus/notifyNewOrder already run as a follow-up
 * step outside the transaction: a push failing/being slow must never affect
 * whether the actual notification/order/wallet write succeeds, and a push
 * for a transaction that later rolled back would be wrong anyway.
 *
 * Every call site of prisma.notification.create / tx.notification.create
 * should have a matching call here right after — same title/body/href.
 */
export async function notifyUser(
  userId: string,
  input: { title: string; body: string; href?: string },
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
    if (!user?.pushToken) return;
    await sendExpoPush(user.pushToken, input);
  } catch (e) {
    console.error(`[notifyUser] failed for user ${userId}:`, e);
  }
}
