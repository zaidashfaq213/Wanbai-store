// GSM order status emails — same branded shell as lib/emails/order-status.ts,
// separate copy because the status set is different (GSM's own pipeline:
// Pending → Paid → Under Review → In Progress → Completed / Rejected /
// Cancelled), not the game-store Order's.
import { SITE_URL } from "@/lib/seo";

const BRAND = "WANBI STOER";
const NAVY = "#0a2e5c";
const GOLD = "#e2a025";

export type GsmNotifiableStatus =
  | "PENDING"
  | "PAID"
  | "UNDER_REVIEW"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

type Copy = { subject: string; body: string };

const COPY: Record<GsmNotifiableStatus, Record<"en" | "ar", (ref: string, service: string) => Copy>> = {
  PENDING: {
    en: (ref, service) => ({ subject: "Your GSM Order Has Been Received", body: `Your order #${ref} for ${service} has been received.` }),
    ar: (ref, service) => ({ subject: "تم استلام طلب الخدمة الخاص بك", body: `تم استلام طلبك رقم #${ref} لخدمة ${service}.` }),
  },
  PAID: {
    en: (ref, service) => ({
      subject: "Your GSM Order Has Been Received",
      body: `Your order #${ref} for ${service} has been received and is currently being processed.\n\nWe will email you again as it moves forward.`,
    }),
    ar: (ref, service) => ({
      subject: "تم استلام طلب الخدمة الخاص بك",
      body: `تم استلام طلبك رقم #${ref} لخدمة ${service} وهو الآن قيد المعالجة.\n\nسنرسل لك بريداً آخر عند تحديث حالته.`,
    }),
  },
  UNDER_REVIEW: {
    en: (ref, service) => ({ subject: "Your GSM Order Is Under Review", body: `Our team is reviewing the details you submitted for order #${ref} (${service}).` }),
    ar: (ref, service) => ({ subject: "طلب الخدمة الخاص بك قيد المراجعة", body: `فريقنا يراجع الآن البيانات التي أرسلتها لطلبك رقم #${ref} (${service}).` }),
  },
  IN_PROGRESS: {
    en: (ref, service) => ({ subject: "Work Has Started on Your GSM Order", body: `We've started working on your order #${ref} (${service}).` }),
    ar: (ref, service) => ({ subject: "بدأ العمل على طلب الخدمة الخاص بك", body: `بدأنا العمل على طلبك رقم #${ref} (${service}).` }),
  },
  COMPLETED: {
    en: (ref, service) => ({
      subject: "Your GSM Order Has Been Completed",
      body: `Your order #${ref} for ${service} has been completed successfully.\n\nThank you for using ${BRAND}. We appreciate your business.`,
    }),
    ar: (ref, service) => ({
      subject: "تم إتمام طلب الخدمة الخاص بك",
      body: `تم إتمام طلبك رقم #${ref} لخدمة ${service} بنجاح.\n\nشكراً لاستخدامك ${BRAND}. نقدّر ثقتك بنا.`,
    }),
  },
  REJECTED: {
    en: (ref, service) => ({
      subject: "There Was a Problem With Your GSM Order",
      body: `Unfortunately, your order #${ref} for ${service} could not be completed.\n\nThe amount has been credited back to your wallet. Please contact support if you need help.`,
    }),
    ar: (ref, service) => ({
      subject: "حدثت مشكلة في طلب الخدمة الخاص بك",
      body: `للأسف، تعذّر إتمام طلبك رقم #${ref} لخدمة ${service}.\n\nتمت إعادة المبلغ إلى محفظتك. تواصل مع الدعم إذا احتجت مساعدة.`,
    }),
  },
  CANCELLED: {
    en: (ref, service) => ({
      subject: "Your GSM Order Has Been Cancelled",
      body: `Your order #${ref} for ${service} has been cancelled and the amount credited back to your wallet.`,
    }),
    ar: (ref, service) => ({
      subject: "تم إلغاء طلب الخدمة الخاص بك",
      body: `تم إلغاء طلبك رقم #${ref} لخدمة ${service} وتمت إعادة المبلغ إلى محفظتك.`,
    }),
  },
};

export function gsmOrderStatusEmail(
  status: GsmNotifiableStatus,
  order: { ref: string; locale: string; serviceName: string },
): { subject: string; text: string; html: string } {
  const locale = order.locale === "ar" ? "ar" : "en";
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const { subject, body } = COPY[status][locale](order.ref, order.serviceName);
  const cta = isAr ? "عرض الطلب" : "View order";
  const url = `${SITE_URL}/${locale}/dashboard/gsm-orders/${order.ref}`;

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
                <span style="color:${GOLD};font-size:12px;font-weight:bold;display:block;margin-top:2px;">${isAr ? "خدمات GSM" : "GSM Services"}</span>
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
