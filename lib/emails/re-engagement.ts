// "Come back" re-engagement email — sent by the cron job in
// app/api/cron/re-engagement to customers who've gone quiet. Subject/body
// come from ReEngagementSettings (admin-editable); this just wraps them in a
// branded HTML shell, in whichever locale the recipient prefers.
import { SITE_URL } from "@/lib/seo";

const BRAND = "WANBI STOER";
const NAVY = "#0a2e5c";
const GOLD = "#e2a025";

export function reEngagementEmail(input: {
  locale: "ar" | "en";
  subject: string;
  body: string;
}): { subject: string; text: string; html: string } {
  const { locale, subject, body } = input;
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const cta = isAr ? "تسوّق الآن" : "Shop now";
  const url = SITE_URL.replace(/\/$/, "") + `/${locale}`;

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
                <p style="margin:0 0 20px;font-size:16px;line-height:26px;color:#1a1a1a;">
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
