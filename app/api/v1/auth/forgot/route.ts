import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/codes";
import { sendMail } from "@/lib/mail";
import { resetPasswordEmail } from "@/lib/emails/reset-password";
import { ok, fail } from "@/lib/api/core";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_email");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const raw = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
    const locale = user.preferredLocale === "en" ? "en" : "ar";
    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    const link = `${base}/${locale}/reset-password?token=${raw}`;
    await sendMail({ to: user.email, ...resetPasswordEmail(locale, link) });
  }
  // Always success — never leak which emails exist.
  return ok({ sent: true });
}
