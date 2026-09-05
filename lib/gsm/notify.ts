import "server-only";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { gsmOrderStatusEmail, type GsmNotifiableStatus } from "@/lib/emails/gsm-order-status";

/** Same idea as lib/orders/notify.ts notifyOrderStatus, for GsmOrder. */
export async function notifyGsmOrderStatus(orderId: string, status: GsmNotifiableStatus): Promise<void> {
  const order = await prisma.gsmOrder.findUnique({
    where: { id: orderId },
    select: { ref: true, email: true, locale: true, serviceName: true, status: true, notifiedStatus: true },
  });
  if (!order) return;
  if (order.status !== status || order.notifiedStatus === status) return;

  const email = gsmOrderStatusEmail(status, {
    ref: order.ref,
    locale: order.locale,
    serviceName: order.serviceName,
  });
  try {
    await sendMail({ to: order.email, subject: email.subject, text: email.text, html: email.html });
    await prisma.gsmOrder.update({ where: { id: orderId }, data: { notifiedStatus: status } });
  } catch (e) {
    console.error(`[notifyGsmOrderStatus] failed to email order ${order.ref} (${status}):`, e);
  }
}
