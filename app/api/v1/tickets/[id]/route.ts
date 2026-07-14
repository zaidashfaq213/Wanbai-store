import { prisma } from "@/lib/db";
import { ok, notFound, getApiUser, unauthorized } from "@/lib/api/core";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!ticket) return notFound();
  return ok({ ticket });
}
