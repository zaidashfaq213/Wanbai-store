import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// --- Customer-facing ---

export function getActiveBankAccounts() {
  return prisma.bankAccount.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

// Banks an admin has opted into the GSM (USD) top-up form — a separate flag
// from `active` above, since a bank can be offered on one form, both, or
// neither. See BankAccount.forGsm.
export function getActiveGsmBankAccounts() {
  return prisma.bankAccount.findMany({
    where: { forGsm: true },
    orderBy: { sortOrder: "asc" },
  });
}

// No `purpose` = the main store wallet page's view (WALLET_TOPUP/ORDER only —
// GSM_TOPUP has its own dashboard page and must never leak into this list).
// Pass "GSM_TOPUP" explicitly to get that page's submissions instead.
export function getUserSubmissions(
  userId: string,
  purpose?: "WALLET_TOPUP" | "ORDER" | "GSM_TOPUP",
) {
  return prisma.paymentSubmission.findMany({
    where: {
      userId,
      purpose: purpose ? purpose : { not: "GSM_TOPUP" },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { bankAccount: true },
  });
}

export function getPendingSubmissionForOrder(orderId: string) {
  return prisma.paymentSubmission.findFirst({
    where: { orderId, status: "PENDING" },
  });
}

// --- Admin ---

export function getAllBankAccounts() {
  return prisma.bankAccount.findMany({ orderBy: { sortOrder: "asc" } });
}

export function getSubmissions(
  status?: "PENDING" | "APPROVED" | "REJECTED",
  purpose?: "WALLET_TOPUP" | "ORDER" | "GSM_TOPUP",
) {
  return prisma.paymentSubmission.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(purpose ? { purpose } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      bankAccount: true,
      user: { select: { name: true, email: true, username: true } },
      order: { select: { ref: true } },
    },
  });
}

export function getPendingSubmissionCount() {
  return prisma.paymentSubmission.count({ where: { status: "PENDING" } });
}

type OrderStatusFilter =
  | "PENDING"
  | "PAID"
  | "DELIVERED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export function getAllOrders(status?: OrderStatusFilter) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });
}

// Orders with an unread customer message, so the list can flag them.
export async function getUnreadOrderMessages() {
  const rows = await prisma.orderMessage.groupBy({
    by: ["orderId"],
    where: { isStaff: false, readByStaff: false },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.orderId, r._count?._all ?? 0]));
}

// Everything an admin needs on one screen: customer, items, proofs and chat.
// Opening the thread marks the customer's messages as seen.
export async function getAdminOrderDetail(ref: string) {
  const order = await prisma.order.findUnique({
    where: { ref },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          walletBalance: true,
        },
      },
      paymentSubmissions: {
        orderBy: { createdAt: "desc" },
        include: { bankAccount: true },
      },
      walletTransactions: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!order) return null;

  await prisma.orderMessage.updateMany({
    where: { orderId: order.id, isStaff: false, readByStaff: false },
    data: { readByStaff: true },
  });

  return order;
}

export const USERS_PER_PAGE = 50;

/**
 * Customers for the admin Users page — searched and paged in the DATABASE,
 * not in the browser. This used to be a blind `take: 200` with the search
 * box filtering only those loaded rows, which meant every customer outside
 * the 200 newest was both invisible and unfindable (an admin searching a
 * real customer's email got "no results" and reasonably concluded the
 * account didn't exist).
 *
 * `query` matches email / username / name case-insensitively, plus an exact
 * customer id — admins paste all four.
 */
export async function getAllUsers(opts: { query?: string; page?: number } = {}) {
  const query = opts.query?.trim() ?? "";
  const page = Math.max(1, opts.page ?? 1);

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { id: query },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PER_PAGE,
      take: USERS_PER_PAGE,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        walletBalance: true,
        gsmWalletBalance: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, perPage: USERS_PER_PAGE };
}

export function getAdminCounts() {
  return prisma.$transaction([
    prisma.paymentSubmission.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "PAID"] } } }),
    prisma.user.count(),
    prisma.order.count(),
  ]);
}

// Basic sales reporting: revenue from paid/delivered orders + top products.
export async function getSalesSummary() {
  const settledStatuses: ("PAID" | "DELIVERED")[] = ["PAID", "DELIVERED"];
  const agg = await prisma.order.aggregate({
    _sum: { total: true },
    _count: true,
    where: { status: { in: settledStatuses } },
  });
  const topItems = await prisma.orderItem.groupBy({
    by: ["productSlug", "productName"],
    _count: { _all: true },
    _sum: { unitPrice: true },
    where: { order: { status: { in: settledStatuses } } },
    orderBy: { _count: { productSlug: "desc" } },
    take: 5,
  });
  return {
    revenueCents: agg._sum?.total ?? 0,
    paidOrders: typeof agg._count === "number" ? agg._count : 0,
    topItems: topItems.map((t) => ({
      slug: t.productSlug,
      name: t.productName,
      count: t._count?._all ?? 0,
      revenueCents: t._sum?.unitPrice ?? 0,
    })),
  };
}
