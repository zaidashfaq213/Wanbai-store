import { prisma } from "@/lib/db";
import { ok, fail, withAuth } from "@/lib/api/core";
import { createGsmOrderForUser } from "@/lib/gsm/create";

// GET /api/v1/gsm/orders — the caller's GSM orders
export const GET = withAuth(async (_req, user) => {
  const orders = await prisma.gsmOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { service: { select: { nameEn: true, nameAr: true } } },
  });
  return ok({ orders });
});

// POST /api/v1/gsm/orders — multipart/form-data: serviceId, locale, plus one
// field per GsmServiceField.key (text/number values, or a file for "file"
// kind fields) — same wallet-only flow as the web checkout (lib/gsm/create.ts).
export const POST = withAuth(async (req, user) => {
  const formData = await req.formData().catch(() => null);
  if (!formData) return fail("invalid_input");

  const serviceId = String(formData.get("serviceId") ?? "");
  const locale = String(formData.get("locale") ?? "ar");
  if (!serviceId) return fail("invalid_input");

  const result = await createGsmOrderForUser(
    { id: user.id, email: user.email },
    { locale, serviceId, formData },
  );
  if (!result.ok) {
    return fail(result.code, result.code === "insufficient_funds" ? 402 : 400);
  }

  const order = await prisma.gsmOrder.findUnique({ where: { ref: result.ref } });
  return ok({ order }, 201);
});
