import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { imageToDataUrl, GSM_FILE_MAX_BYTES, GSM_FILE_ALLOWED } from "@/lib/upload";
import { notifyGsmOrderStatus } from "./notify";
import { notifyNewGsmOrder } from "@/lib/telegram";

// Wallet-only checkout for a GSM service — mirrors lib/orders/create.ts's
// createOrderForUser, but writes to GsmOrder/GsmOrderFile instead of
// Order/OrderItem and has no auto-fulfilment step (every GSM order is
// worked by hand, that's the whole point of the service).

export type CreateGsmOrderResult =
  | { ok: true; ref: string }
  | { ok: false; code: "insufficient_funds" | "not_found" | "invalid_input" | "server_error" };

export async function createGsmOrderForUser(
  user: { id: string; email: string },
  input: { locale: string; serviceId: string; formData: FormData },
): Promise<CreateGsmOrderResult> {
  const { locale, serviceId, formData } = input;

  const service = await prisma.gsmService.findFirst({
    where: { id: serviceId, active: true },
    include: { fields: true, category: { select: { nameEn: true, nameAr: true } } },
  });
  if (!service) return { ok: false, code: "not_found" };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { walletBalance: true },
  });
  if (!dbUser || dbUser.walletBalance < service.price) {
    return { ok: false, code: "insufficient_funds" };
  }

  // Validate + collect field answers before touching the DB.
  const inputs: Record<string, string> = {};
  const files: { fieldKey: string; filename: string; dataUrl: string }[] = [];
  for (const field of service.fields) {
    if (field.kind === "file") {
      const raw = formData.get(field.key);
      if (!(raw instanceof File) || raw.size === 0) {
        if (field.required) return { ok: false, code: "invalid_input" };
        continue;
      }
      const uploaded = await imageToDataUrl(raw, GSM_FILE_MAX_BYTES, GSM_FILE_ALLOWED);
      if (!uploaded.ok) return { ok: false, code: "invalid_input" };
      files.push({ fieldKey: field.key, filename: raw.name, dataUrl: uploaded.dataUrl });
    } else {
      const value = String(formData.get(field.key) ?? "").trim();
      if (field.required && !value) return { ok: false, code: "invalid_input" };
      if (value) inputs[field.key] = value;
    }
  }

  const ref = `GSM-${randomBytes(4).toString("hex").toUpperCase()}`;
  const categoryName = locale === "ar" ? service.category.nameAr : service.category.nameEn;
  const serviceName = locale === "ar" ? service.nameAr : service.nameEn;

  let orderId: string;
  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.gsmOrder.create({
        data: {
          ref,
          userId: user.id,
          email: user.email,
          serviceId: service.id,
          serviceName,
          categoryName,
          price: service.price,
          currency: "USD",
          locale,
          status: "PAID",
          inputs,
          files: {
            create: files.map((f) => ({
              data: f.dataUrl,
              filename: f.filename,
              source: "customer",
              fieldKey: f.fieldKey,
            })),
          },
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { walletBalance: { decrement: service.price } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          amount: -service.price,
          type: "PURCHASE",
          description: `GSM order ${ref}`,
          orderId: null,
        },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "ORDER",
          title: `GSM order ${ref} paid`,
          body: `${serviceName} — we're reviewing it now.`,
          href: "/dashboard/gsm-orders",
        },
      });
      return created;
    });
    orderId = order.id;
  } catch (e) {
    console.error("[createGsmOrderForUser] failed:", e);
    return { ok: false, code: "server_error" };
  }

  await notifyGsmOrderStatus(orderId, "PAID");
  void notifyNewGsmOrder({ ref, serviceName, totalCents: service.price, email: user.email });
  return { ok: true, ref };
}
