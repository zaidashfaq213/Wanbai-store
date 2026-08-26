// Order status notification emails — one for every stage an order can be in.
// Sent by lib/orders/notify.ts, which also de-duplicates so the same status
// never emails a customer twice (see Order.notifiedStatus in the schema).
import { SITE_URL } from "@/lib/seo";

const BRAND = "WANBI STOER";
const NAVY = "#0a2e5c";
const GOLD = "#e2a025";

export type NotifiableStatus = "PENDING" | "PAID" | "DELIVERED" | "FAILED" | "REFUNDED" | "CANCELLED";

type Copy = { subject: string; body: string };

const COPY: Record<NotifiableStatus, Record<"en" | "ar", (ref: string) => Copy>> = {
  PENDING: {
    en: (ref) => ({
      subject: "Your Order Has Been Received",
      body: `Your order #${ref} has been successfully received and is currently being processed.\n\nWe will send you another email when your order has been completed.`,
    }),
    ar: (ref) => ({
      subject: "تم استلام طلبك",
      body: `تم استلام طلبك رقم #${ref} بنجاح وهو الآن قيد المعالجة.\n\nسنرسل لك بريداً آخر عند اكتمال طلبك.`,
    }),
  },
  PAID: {
    en: (ref) => ({
      subject: "Your Order Has Been Received",
      body: `Your order #${ref} has been successfully received and is currently being processed.\n\nWe will send you another email when your order has been completed.`,
    }),
    ar: (ref) => ({
      subject: "تم استلام طلبك",
      body: `تم استلام طلبك رقم #${ref} بنجاح وهو الآن قيد المعالجة.\n\nسنرسل لك بريداً آخر عند اكتمال طلبك.`,
    }),
  },
  DELIVERED: {
    en: (ref) => ({
      subject: "Your Order Has Been Completed Successfully",
      body: `Your order #${ref} has been completed successfully.\n\nThank you for using ${BRAND}. We appreciate your business.`,
    }),
    ar: (ref) => ({
      subject: "تم إتمام طلبك بنجاح",
      body: `تم تنفيذ طلبك رقم #${ref} بنجاح.\n\nشكراً لاستخدامك ${BRAND}. نقدّر ثقتك بنا.`,
    }),
  },
  FAILED: {
    en: (ref) => ({
      subject: "There Was a Problem With Your Order",
      body: `Unfortunately, your order #${ref} could not be completed.\n\nIf you were charged, the amount has been credited back to your wallet. Please contact support if you need help.`,
    }),
    ar: (ref) => ({
      subject: "حدثت مشكلة في طلبك",
      body: `للأسف، تعذّر إتمام طلبك رقم #${ref}.\n\nإذا تم خصم المبلغ، فقد تمت إعادته إلى محفظتك. تواصل مع الدعم إذا احتجت مساعدة.`,
    }),
  },
  REFUNDED: {
    en: (ref) => ({
      subject: "Your Order Has Been Refunded",
      body: `Your order #${ref} has been refunded — the amount has been credited back to your wallet balance.`,
    }),
    ar: (ref) => ({
      subject: "تم استرجاع مبلغ طلبك",
      body: `تم استرجاع مبلغ طلبك رقم #${ref} إلى رصيد محفظتك.`,
    }),
  },
  CANCELLED: {
    en: (ref) => ({
      subject: "Your Order Has Been Cancelled",
      body: `Your order #${ref} has been cancelled.\n\nContact support if this wasn't expected.`,
    }),
    ar: (ref) => ({
      subject: "تم إلغاء طلبك",
      body: `تم إلغاء طلبك رقم #${ref}.\n\nتواصل مع الدعم إذا لم يكن هذا متوقعاً.`,
    }),
  },
};

export function orderStatusEmail(
  status: NotifiableStatus,
  order: { ref: string; locale: string },
): { subject: string; text: string; html: string } {
  const locale = order.locale === "ar" ? "ar" : "en";
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const { subject, body } = COPY[status][locale](order.ref);
  const cta = isAr ? "عرض الطلب" : "View order";
  const url = `${SITE_URL}/${locale}/dashboard/orders/${order.ref}`;

  const text = [body, "", `${cta}: ${url}`, "", `— ${BRAND}`].join("\n");

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" dir="${dir}" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ececf1;">
            <tr>
              <td style="background:${NAVY};padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;text-align:${isAr ? "right" : "left"};">
                <p style="margin:0 0 20px;font-size:16px;line-height:26px;color:#1a1a1a;white-space:pre-line;">
                  ${body}
                </p>
                <div style="text-align:center;margin:8px 0 4px;">
                  <a href="${url}" style="display:inline-block;background:${GOLD};color:#1a1a1a;font-size:15px;font-weight:bold;padding:12px 28px;border-radius:10px;text-decoration:none;">
                    ${cta}
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
