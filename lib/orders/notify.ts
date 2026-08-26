import "server-only";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { orderStatusEmail, type NotifiableStatus } from "@/lib/emails/order-status";

/**
 * Emails the customer that their order's status changed — "received",
 * "completed", "failed", "refunded" or "cancelled" — using Order.locale to
 * pick English or Arabic. Idempotent: compares against
 * Order.notifiedStatus first, so calling this twice for the same status
 * (a webhook retry, a double admin click, two code paths touching the same
 * transition) only ever sends one email.
 *
 * Call this AFTER the status has already been written to the DB — it reads
 * the order fresh rather than trusting a stale in-memory copy.
 */
export async function notifyOrderStatus(orderId: string, status: NotifiableStatus): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { ref: true, email: true, locale: true, status: true, notifiedStatus: true },
  });
  if (!order) return;

  // The order may have moved on again since the caller looked — only email
  // for the status it's actually in right now, and only once per status.
  if (order.status !== status || order.notifiedStatus === status) return;

  const email = orderStatusEmail(status, { ref: order.ref, locale: order.locale });
  try {
    await sendMail({ to: order.email, subject: email.subject, text: email.text, html: email.html });
    await prisma.order.update({ where: { id: orderId }, data: { notifiedStatus: status } });
  } catch (e) {
    // Don't let a mail-server hiccup break the caller's transaction/response
    // — the order's real status is already saved either way.
    console.error(`[notifyOrderStatus] failed to email order ${order.ref} (${status}):`, e);
  }
}
