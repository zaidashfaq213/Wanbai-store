import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, getApiUser, unauthorized } from "@/lib/api/core";

const schema = z.object({ body: z.string().trim().min(1).max(4000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: user.id },
  });
  if (!ticket || ticket.status === "CLOSED") return fail("invalid_input");

  const [message] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: { ticketId: ticket.id, authorId: user.id, isStaff: false, body: parsed.data.body },
    }),
    prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: "OPEN" } }),
  ]);
  return ok({ message }, 201);
}
