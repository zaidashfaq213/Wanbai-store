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

export function getSubmissions(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return prisma.paymentSubmission.findMany({
    where: status ? { status } : undefined,
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

export function getAllOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });
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
