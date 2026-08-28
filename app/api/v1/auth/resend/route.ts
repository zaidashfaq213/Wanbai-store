import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueVerificationCode } from "@/lib/auth/codes";
import { ok, fail } from "@/lib/api/core";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_email");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Don't reveal whether the account exists.
  if (user && !user.emailVerified) {
    await issueVerificationCode(parsed.data.email, user.preferredLocale === "en" ? "en" : "ar");
  }
  return ok({ sent: true });
}
