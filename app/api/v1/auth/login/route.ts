import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ok, fail, signToken } from "@/lib/api/core";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_credentials", 401);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.passwordHash) return fail("invalid_credentials", 401);

  const match = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!match) return fail("invalid_credentials", 401);

  // Email verification is disabled — no emailVerified gate.
  const token = await signToken(user.id, user.role);
  return ok({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
