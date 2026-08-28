// "Order delivered" email — the one variant of the DELIVERED status that
// carries a code/details (gift-card codes from manual fulfilment; G2Bulk
// top-ups never have one). Kept separate from lib/emails/order-status.ts's
// generic DELIVERED copy for exactly that reason — see the notifiedStatus
// comments in lib/actions/payments.ts and app/api/webhook/g2bulk/route.ts.
//
// Shared by the manual "Deliver" admin action and the G2Bulk webhook — used
// to be two separately hand-written, English-only copies.
import { SITE_URL } from "@/lib/seo";

const BRAND = "WANBI STOER";
const NAVY = "#0a2e5c";
const GOLD = "#e2a025";

export function orderDeliveredEmail(input: {
  locale: string;
  ref: string;
  productName: string;
  packageLabel: string;
  code?: string | null;
}): { subject: string; text: string; html: string } {
  const isAr = input.locale === "ar";
  const locale = isAr ? "ar" : "en";
  const dir = isAr ? "rtl" : "ltr";

  const subject = isAr ? `${BRAND} — تم تسليم طلبك ${input.ref}` : `${BRAND} — Order ${input.ref} delivered`;
  const line = isAr
    ? `تم تسليم طلبك رقم ${input.ref} — ${input.productName} · ${input.packageLabel}.`
    : `Your order ${input.ref} — ${input.productName} · ${input.packageLabel} — has been delivered.`;
  const codeLabel = isAr ? "الكود / التفاصيل:" : "Your code / details:";
  const noCodeLine = isAr ? "تم إتمام الشحن / الخدمة الخاصة بك." : "Your top-up / service has been completed.";
  const thanks = isAr ? `شكراً لتسوقك من ${BRAND}.` : `Thank you for shopping with ${BRAND}.`;
  const cta = isAr ? "عرض الطلب" : "View order";
  const url = `${SITE_URL}/${locale}/dashboard/orders/${input.ref}`;

  const text = [
    line,
    input.code ? `${codeLabel} ${input.code}` : noCodeLine,
    thanks,
    "",
    `${cta}: ${url}`,
    "",
    `— ${BRAND}`,
  ].join("\n");

  const codeBlock = input.code
    ? `<p style="margin:0 0 4px;font-size:13px;color:#6b7280;">${codeLabel}</p><p style="margin:0 0 20px;font-size:20px;font-weight:800;font-family:monospace;letter-spacing:0.5px;">${input.code}</p>`
    : `<p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;">${noCodeLine}</p>`;

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
                <p style="margin:0 0 20px;font-size:16px;line-height:26px;color:#1a1a1a;">
                  ${line}
                </p>
                ${codeBlock}
                <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">${thanks}</p>
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
