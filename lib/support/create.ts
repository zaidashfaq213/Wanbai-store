import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { notifyNewTicket } from "@/lib/telegram";

// Single source of truth for opening a support ticket — used by both the web
// action (lib/actions/support.ts) and the mobile REST API
// (app/api/v1/tickets/route.ts), which used to duplicate this exact write.
// Same lesson as lib/orders/create.ts: a duplicate path here is exactly how
// a future addition (like this Telegram alert) silently misses mobile.
export async function createTicketForUser(
  user: { id: string; email: string },
  input: { subject: string; body: string },
) {
  const ticket = await prisma.supportTicket.create({
    data: {
      ref: `TK-${randomBytes(3).toString("hex").toUpperCase()}`,
      userId: user.id,
      subject: input.subject,
      messages: { create: { authorId: user.id, isStaff: false, body: input.body } },
    },
  });

  void notifyNewTicket({ ref: ticket.ref, subject: ticket.subject, email: user.email });
  return ticket;
}
