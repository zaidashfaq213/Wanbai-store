import { prisma } from "@/lib/db";
import { ok, fail, notFound, getApiUser, unauthorized } from "@/lib/api/core";

// POST /api/v1/gsm/orders/:ref/notes — customer reply on their own order's
// note thread. Mirrors lib/actions/gsm-checkout.ts's addCustomerGsmOrderNote.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const { ref } = await params;

  const body = await req.json().catch(() => null);
  const text = String(body?.body ?? "").trim().slice(0, 2000);
  if (!text) return fail("invalid_input");

  const order = await prisma.gsmOrder.findFirst({ where: { ref, userId: user.id }, select: { id: true } });
  if (!order) return notFound();

  const note = await prisma.gsmOrderNote.create({
    data: { orderId: order.id, authorId: user.id, isStaff: false, body: text },
  });
  return ok({ note }, 201);
}
