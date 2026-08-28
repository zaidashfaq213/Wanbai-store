// Password-reset email — shared by the web action (lib/auth/actions.ts) and
// the mobile REST API (app/api/v1/auth/forgot). Used to be two separately
// hand-written, drifted copies (the mobile one had no locale support and
// thinner copy) — unified here so both always look and read the same.
const BRAND = "WANBI STOER";
const NAVY = "#0a2e5c";
const GOLD = "#e2a025";

export function resetPasswordEmail(
  locale: "ar" | "en",
  link: string,
): { subject: string; text: string; html: string } {
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const subject = isAr ? `${BRAND} — إعادة تعيين كلمة المرور` : `${BRAND} — Reset your password`;
  const intro = isAr
    ? `تلقينا طلباً لإعادة تعيين كلمة مرور حسابك في ${BRAND}.`
    : `We received a request to reset your ${BRAND} password.`;
  const cta = isAr ? "إعادة تعيين كلمة المرور" : "Reset your password";
  const validity = isAr ? "صالح لمدة ساعة واحدة." : "Valid for 1 hour.";
  const ignore = isAr
    ? "إذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان."
    : "If you didn't request this, you can safely ignore this email.";

  const text = [intro, `${cta}: ${link}`, validity, "", ignore, "", `— ${BRAND}`].join("\n");

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
                  ${intro}
                </p>
                <div style="text-align:center;margin:8px 0 20px;">
                  <a href="${link}" style="display:inline-block;background:${GOLD};color:#1a1a1a;font-size:15px;font-weight:bold;padding:12px 28px;border-radius:10px;text-decoration:none;">
                    ${cta}
                  </a>
                </div>
                <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">${validity}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;">${ignore}</p>
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
