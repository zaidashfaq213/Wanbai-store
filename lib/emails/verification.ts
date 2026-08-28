// Shared, well-formed verification email used by both the web actions and the
// mobile API. A proper HTML document + a balanced plain-text part and a clear
// transactional subject noticeably improve inbox placement (vs. thin, all-caps
// snippets which spam filters penalise).
const BRAND = "WANBI STOER";
const SUPPORT = "wanbaistoer.tech@gmail.com";
const NAVY = "#0a2e5c";
const GOLD = "#e2a025";

export function verificationEmail(
  code: string,
  locale: "ar" | "en" = "ar",
): { subject: string; text: string; html: string } {
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const subject = isAr ? `${code} هو رمز التحقق الخاص بك في ${BRAND}` : `${code} is your ${BRAND} verification code`;
  const welcome = isAr ? `أهلاً بك في ${BRAND}.` : `Welcome to ${BRAND}.`;
  const title = isAr ? "تأكيد بريدك الإلكتروني" : "Confirm your email";
  const intro = isAr
    ? `استخدم الرمز أدناه لإتمام إنشاء حسابك في ${BRAND}.`
    : `Use the code below to finish creating your ${BRAND} account.`;
  const expiry = isAr ? "ينتهي هذا الرمز خلال 15 دقيقة." : "This code expires in 15 minutes.";
  const ignore = isAr
    ? "إذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان."
    : "If you didn't request this, you can safely ignore this email.";
  const help = isAr
    ? `${BRAND} · بحاجة لمساعدة؟ رد على هذا البريد أو تواصل مع ${SUPPORT}`
    : `${BRAND} · Need help? Reply to this email or contact ${SUPPORT}`;

  const text = [welcome, "", `${title}: ${code}`, "", expiry, ignore, "", `— ${BRAND}`].join("\n");

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
                <p style="margin:0 0 8px;font-size:16px;font-weight:bold;">${title}</p>
                <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#4a4a55;">
                  ${intro}
                </p>
                <div style="text-align:center;margin:0 0 20px;">
                  <span style="display:inline-block;background:#fdf3e0;color:${NAVY};font-size:30px;font-weight:bold;letter-spacing:8px;padding:14px 24px;border-radius:10px;border:1px solid ${GOLD};">${code}</span>
                </div>
                <p style="margin:0 0 6px;font-size:13px;line-height:20px;color:#6a6a75;">
                  ${expiry}
                </p>
                <p style="margin:0;font-size:13px;line-height:20px;color:#6a6a75;">
                  ${ignore}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #ececf1;">
                <p style="margin:0;font-size:12px;color:#9a9aa5;">
                  ${help}
                </p>
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
