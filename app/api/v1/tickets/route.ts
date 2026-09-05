import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, withAuth } from "@/lib/api/core";
import { createTicketForUser } from "@/lib/support/create";

export const GET = withAuth(async (_req, user) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return ok({ tickets });
});

const schema = z.object({
  subject: z.string().trim().min(4).max(120),
  body: z.string().trim().min(10).max(4000),
});

export const POST = withAuth(async (req, user) => {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");

  const ticket = await createTicketForUser(
    { id: user.id, email: user.email },
    { subject: parsed.data.subject, body: parsed.data.body },
  );
  return ok({ ticket }, 201);
});
