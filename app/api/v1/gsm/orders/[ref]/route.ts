import { prisma } from "@/lib/db";
import { ok, notFound, getApiUser, unauthorized } from "@/lib/api/core";

// GET /api/v1/gsm/orders/:ref — one GSM order with its fields, files and notes.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const { ref } = await params;

  const order = await prisma.gsmOrder.findFirst({
    where: { ref, userId: user.id },
    include: {
      service: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
      files: { orderBy: { createdAt: "asc" } },
      notes: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!order) return notFound();

  return ok({ order });
}
