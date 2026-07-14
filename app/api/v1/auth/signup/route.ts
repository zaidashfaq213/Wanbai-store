import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { issueVerificationCode } from "@/lib/auth/codes";
import { ok, fail } from "@/lib/api/core";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "password") return fail("weak_password");
    if (field === "email") return fail("invalid_email");
    if (field === "username") return fail("invalid_username");
    return fail("invalid_input");
  }
  const { name, username, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) return fail("email_taken", 409);
  if (await prisma.user.findUnique({ where: { username } })) return fail("username_taken", 409);

  await prisma.user.create({
    data: { name, username, email, passwordHash: await bcrypt.hash(password, 12) },
  });
  await issueVerificationCode(email);

  // Account exists but is unverified — the app now asks for the 6-digit code.
  return ok({ verificationRequired: true, email }, 201);
}
