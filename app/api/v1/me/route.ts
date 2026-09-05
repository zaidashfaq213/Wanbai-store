import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, withAuth } from "@/lib/api/core";

export const GET = withAuth(async (_req, user) => ok({ user }));

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  preferredLocale: z.enum(["ar", "en"]).optional(),
  preferredCurrency: z.string().trim().max(8).optional(),
});

export const PATCH = withAuth(async (req, user) => {
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: {
      id: true, email: true, name: true, username: true, role: true,
      walletBalance: true, gsmWalletBalance: true, preferredLocale: true, preferredCurrency: true,
    },
  });
  return ok({ user: updated });
});
