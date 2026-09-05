"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { createGsmOrderForUser } from "@/lib/gsm/create";
import type { GsmState } from "@/lib/actions/gsm-admin";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}

export type GsmCheckoutState =
  | { ok: true; ref: string }
  | { ok: false; code: string };

// Client-facing wrapper around createGsmOrderForUser — a plain "use server"
// action so the dynamic checkout form (which may include file inputs) can
// submit real FormData straight through, the same way ProductInput file
// uploads (imageToDataUrl) already work elsewhere.
export async function submitGsmOrder(
  _prev: GsmCheckoutState,
  formData: FormData,
): Promise<GsmCheckoutState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };

  const serviceId = String(formData.get("serviceId") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  if (!serviceId) return { ok: false, code: "invalid_input" };

  const result = await createGsmOrderForUser(
    { id: user.id, email: user.email ?? "" },
    { locale, serviceId, formData },
  );

  if (!result.ok) return { ok: false, code: result.code };

  revalidatePath(`/${locale}/dashboard/gsm-orders`, "layout");
  return { ok: true, ref: result.ref };
}

// Customer reply on their own GSM order's note thread — the mirror of
// lib/actions/gsm-admin.ts's addGsmOrderNote, but scoped to the order owner
// instead of staff.
export async function addCustomerGsmOrderNote(
  _prev: GsmState,
  formData: FormData,
): Promise<GsmState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };
  const ref = String(formData.get("ref") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!ref || !body) return { ok: false, code: "invalid_input" };

  const order = await prisma.gsmOrder.findFirst({ where: { ref, userId: user.id }, select: { id: true } });
  if (!order) return { ok: false, code: "not_found" };

  await prisma.gsmOrderNote.create({
    data: { orderId: order.id, authorId: user.id, isStaff: false, body },
  });

  const locale = loc(String(formData.get("locale") ?? ""));
  revalidatePath(`/${locale}/dashboard/gsm-orders/${ref}`);
  return { ok: true, code: "saved" };
}
