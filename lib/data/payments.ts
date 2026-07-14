import "server-only";
import { prisma } from "@/lib/db";

// --- Customer-facing ---

export function getActiveBankAccounts() {
  return prisma.bankAccount.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function getUserSubmissions(userId: string) {
  return prisma.paymentSubmission.findMany({
    where: { userId },
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
  purpose?: "WALLET_TOPUP" | "ORDER",
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

export function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      walletBalance: true,
      emailVerified: true,
      createdAt: true,
    },
  });
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
