import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeVerificationCode } from "@/lib/auth/codes";
import { ok, fail, signToken } from "@/lib/api/core";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("code_invalid");

  const result = await consumeVerificationCode(parsed.data.email, parsed.data.code);
  if (!result.ok) return fail(result.code);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return fail("not_found", 404);

  // Verified — sign the user straight in.
  const token = await signToken(user.id, user.role);
  return ok({ token, user: { id: user.id, name: user.name, email: user.email } });
}
