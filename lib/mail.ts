import "server-only";
import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!isConfigured) return null;
  if (!transporter) {
    const port = Number(SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // TLS on 465, STARTTLS otherwise
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
}

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  // Overrides the default Reply-To (SMTP_USER) — e.g. the contact form sets
  // this to the visitor's email so support can just hit reply.
  replyTo?: string;
};

/**
 * Send an email via SMTP. When SMTP env vars are not set (e.g. local dev), the
 * message is logged to the server console instead of failing — so the reset
 * flow is still testable before a real mail provider is wired up.
 */
export async function sendMail({ to, subject, html, text, replyTo }: MailInput) {
  const tx = getTransporter();
  if (!tx) {
    console.info(
      `\n[mail:dev] SMTP not configured — email not sent.\n  to: ${to}\n  subject: ${subject}\n  text: ${text ?? html.replace(/<[^>]+>/g, " ").trim()}\n`,
    );
    return { delivered: false as const };
  }
  try {
    await tx.sendMail({
      from: SMTP_FROM ?? "WANBI STOER <no-reply@wanbai.store>",
      // A valid Reply-To (a real inbox) improves inbox placement.
      replyTo: replyTo ?? SMTP_USER,
      to,
      subject,
      html,
      // Always include a plain-text alternative — HTML-only mail scores as spam.
      text: text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    return { delivered: true as const };
  } catch (err) {
    // Never let an SMTP problem (bad credentials, provider block, timeout) crash
    // the caller — signup/login must not 500 because email couldn't be sent.
    // The user is still created and can use "resend code" once mail is fixed.
    console.error("[mail] send failed:", err);
    return { delivered: false as const };
  }
}
