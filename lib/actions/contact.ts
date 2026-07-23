"use server";

import { z } from "zod";
import { sendMail } from "@/lib/mail";
import { getSettings } from "@/lib/data/content";

export type ContactFormState = { ok: boolean; code?: string };

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(10).max(4000),
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

/**
 * Public contact form (no login required): emails the message straight to the
 * store's support inbox with the sender set as Reply-To, so support can just
 * hit reply. No DB write — this is a lightweight channel alongside tickets.
 */
export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { name, email, subject, message } = parsed.data;

  const settings = await getSettings();
  const to = settings.supportEmail?.trim() || process.env.SMTP_USER;
  if (!to) return { ok: false, code: "server_error" };

  const result = await sendMail({
    to,
    replyTo: email,
    subject: `[Contact] ${subject}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
<p style="white-space:pre-line">${escapeHtml(message)}</p>`,
  });
  if (!result.delivered) return { ok: false, code: "server_error" };

  return { ok: true, code: "sent" };
}
