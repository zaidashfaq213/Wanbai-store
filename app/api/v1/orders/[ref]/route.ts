import { prisma } from "@/lib/db";
import { ok, notFound, getApiUser, unauthorized } from "@/lib/api/core";

// GET /api/v1/orders/:ref — one order with its items, payment proofs and chat.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const { ref } = await params;

  const order = await prisma.order.findFirst({
    where: { ref, userId: user.id },
    include: {
      items: true,
      paymentSubmissions: {
        orderBy: { createdAt: "desc" },
        include: {
          bankAccount: { select: { key: true, nameEn: true, nameAr: true, color: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!order) return notFound();

  // Opening the order counts as reading the admin's replies.
  await prisma.orderMessage.updateMany({
    where: { orderId: order.id, isStaff: true, readByUser: false },
    data: { readByUser: true },
  });

  return ok({ order });
}
