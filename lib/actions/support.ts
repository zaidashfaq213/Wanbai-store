"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, getStaffUser } from "@/lib/auth/session";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}
async function requireAdminUser() {
  const u = await getSessionUser();
  return u && u.role === "ADMIN" ? u : null;
}

export type SupportState = { ok: boolean; code?: string };

const newTicketSchema = z.object({
  subject: z.string().trim().min(4).max(120),
  body: z.string().trim().min(10).max(4000),
});

export async function createTicket(
  _prev: SupportState,
  formData: FormData,
): Promise<SupportState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = newTicketSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const ticket = await prisma.supportTicket.create({
    data: {
      ref: `TK-${randomBytes(3).toString("hex").toUpperCase()}`,
      userId: user.id,
      subject: parsed.data.subject,
      messages: {
        create: { authorId: user.id, isStaff: false, body: parsed.data.body },
      },
    },
  });

  redirect(`/${locale}/dashboard/tickets/${ticket.id}`);
}

const replySchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});

export async function replyTicket(
  _prev: SupportState,
  formData: FormData,
): Promise<SupportState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = replySchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
  });
  if (!ticket || ticket.userId !== user.id || ticket.status === "CLOSED") {
    return { ok: false, code: "invalid_input" };
  }

  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: { ticketId: ticket.id, authorId: user.id, isStaff: false, body: parsed.data.body },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "OPEN" },
    }),
  ]);

  revalidatePath(`/${locale}/dashboard/tickets/${ticket.id}`);
  return { ok: true, code: "sent" };
}

// --- Order chat ------------------------------------------------------------
// A thread hanging off a single order, so the customer can ask about *that*
// purchase without opening a support ticket. Both sides post here.

const orderMessageSchema = z.object({
  orderRef: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});

export async function sendOrderMessage(
  _prev: SupportState,
  formData: FormData,
): Promise<SupportState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = orderMessageSchema.safeParse({
    orderRef: formData.get("orderRef"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const order = await prisma.order.findUnique({
    where: { ref: parsed.data.orderRef },
    select: { id: true, userId: true },
  });
  if (!order || order.userId !== user.id) return { ok: false, code: "invalid_input" };

  await prisma.orderMessage.create({
    data: {
      orderId: order.id,
      authorId: user.id,
      isStaff: false,
      body: parsed.data.body,
      readByUser: true,
    },
  });

  revalidatePath(`/${locale}/dashboard/orders/${parsed.data.orderRef}`);
  return { ok: true, code: "sent" };
}

export async function adminReplyOrder(
  _prev: SupportState,
  formData: FormData,
): Promise<SupportState> {
  const admin = await getStaffUser(); // Managers handle orders too
  if (!admin) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = orderMessageSchema.safeParse({
    orderRef: formData.get("orderRef"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const order = await prisma.order.findUnique({
    where: { ref: parsed.data.orderRef },
    select: { id: true, ref: true, userId: true },
  });
  if (!order) return { ok: false, code: "invalid_input" };

  await prisma.orderMessage.create({
    data: {
      orderId: order.id,
      authorId: admin.id,
      isStaff: true,
      body: parsed.data.body,
      readByStaff: true,
    },
  });

  // Ping the customer so the reply is visible outside the order screen too.
  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "ORDER",
        title: `Support replied — ${order.ref}`,
        body: parsed.data.body.slice(0, 140),
        href: `/dashboard/orders/${order.ref}`,
      },
    });
  }

  revalidatePath(`/${locale}/admin/orders/${order.ref}`);
  return { ok: true, code: "sent" };
}

// --- Admin -----------------------------------------------------------------

export async function adminReplyTicket(
  _prev: SupportState,
  formData: FormData,
): Promise<SupportState> {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = replySchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
  });
  if (!ticket) return { ok: false, code: "invalid_input" };

  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: { ticketId: ticket.id, authorId: admin.id, isStaff: true, body: parsed.data.body },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "ANSWERED" },
    }),
    prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: "SYSTEM",
        title: `Support replied — ${ticket.ref}`,
        body: ticket.subject,
        href: "/dashboard/tickets",
      },
    }),
  ]);

  revalidatePath(`/${locale}/admin/tickets/${ticket.id}`);
  return { ok: true, code: "sent" };
}

export async function setTicketStatus(formData: FormData) {
  const admin = await requireAdminUser();
  if (!admin) return;
  const id = String(formData.get("ticketId") ?? "");
  const raw = String(formData.get("status") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  if (!["OPEN", "ANSWERED", "CLOSED"].includes(raw)) return;

  await prisma.supportTicket.update({
    where: { id },
    data: { status: raw as "OPEN" | "ANSWERED" | "CLOSED" },
  });
  revalidatePath(`/${locale}/admin/tickets`);
  revalidatePath(`/${locale}/admin/tickets/${id}`);
}
