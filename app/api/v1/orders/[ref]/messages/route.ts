import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, notFound, getApiUser, unauthorized } from "@/lib/api/core";

async function ownedOrder(req: Request, ref: string) {
  const user = await getApiUser(req);
  if (!user) return { user: null, order: null };
  const order = await prisma.order.findFirst({
    where: { ref, userId: user.id },
    select: { id: true },
  });
  return { user, order };
}

// GET /api/v1/orders/:ref/messages — the thread (also marks replies as read).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const { user, order } = await ownedOrder(req, ref);
  if (!user) return unauthorized();
  if (!order) return notFound();

  const messages = await prisma.orderMessage.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true } } },
  });

  await prisma.orderMessage.updateMany({
    where: { orderId: order.id, isStaff: true, readByUser: false },
    data: { readByUser: true },
  });

  return ok({ messages });
}

const schema = z.object({ body: z.string().trim().min(1).max(4000) });

// POST /api/v1/orders/:ref/messages — customer writes to the admin.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const { user, order } = await ownedOrder(req, ref);
  if (!user) return unauthorized();
  if (!order) return notFound();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");

  const message = await prisma.orderMessage.create({
    data: {
      orderId: order.id,
      authorId: user.id,
      isStaff: false,
      body: parsed.data.body,
      readByUser: true,
    },
    include: { author: { select: { name: true } } },
  });

  return ok({ message }, 201);
}
