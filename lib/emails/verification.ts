// Shared, well-formed verification email used by both the web actions and the
// mobile API. A proper HTML document + a balanced plain-text part and a clear
// transactional subject noticeably improve inbox placement (vs. thin, all-caps
// snippets which spam filters penalise).

const BRAND = "Wanbai Store";
const SUPPORT = "wanbaistoer.tech@gmail.com";

export function verificationEmail(code: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `${code} is your ${BRAND} verification code`;

  const text = [
    `Welcome to ${BRAND}.`,
    ``,
    `Your verification code is: ${code}`,
    ``,
    `Enter this code to confirm your email. It expires in 15 minutes.`,
    `If you didn't create an account, you can safely ignore this email.`,
    ``,
    `— ${BRAND}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ececf1;">
            <tr>
              <td style="background:#7c3aed;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 8px;font-size:16px;font-weight:bold;">Confirm your email</p>
                <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#4a4a55;">
                  Use the code below to finish creating your ${BRAND} account.
                </p>
                <div style="text-align:center;margin:0 0 20px;">
                  <span style="display:inline-block;background:#f2effe;color:#5b21b6;font-size:30px;font-weight:bold;letter-spacing:8px;padding:14px 24px;border-radius:10px;">${code}</span>
                </div>
                <p style="margin:0 0 6px;font-size:13px;line-height:20px;color:#6a6a75;">
                  This code expires in 15 minutes.
                </p>
                <p style="margin:0;font-size:13px;line-height:20px;color:#6a6a75;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #ececf1;">
                <p style="margin:0;font-size:12px;color:#9a9aa5;">
                  ${BRAND} · Need help? Reply to this email or contact ${SUPPORT}
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
