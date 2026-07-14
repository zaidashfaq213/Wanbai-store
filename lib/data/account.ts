import "server-only";
import { prisma } from "@/lib/db";

// Read helpers for the user dashboard. All amounts are USD cents.

export async function getWalletSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return { balance: user?.walletBalance ?? 0, transactions };
}

export async function getOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      paymentSubmissions: {
        select: { status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

// Full order view for the customer: items, payment proof history and the chat
// thread with the admin. Opening the thread marks the staff replies as seen.
export async function getOrderDetail(ref: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { ref, userId },
    include: {
      items: true,
      paymentSubmissions: {
        orderBy: { createdAt: "desc" },
        include: { bankAccount: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!order) return null;

  await prisma.orderMessage.updateMany({
    where: { orderId: order.id, isStaff: true, readByUser: false },
    data: { readByUser: true },
  });

  return order;
}

// Unread admin replies per order ref, so the orders list can badge a thread.
export async function getUnreadOrderReplies(userId: string) {
  const rows = await prisma.orderMessage.groupBy({
    by: ["orderId"],
    where: { isStaff: true, readByUser: false, order: { userId } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.orderId, r._count?._all ?? 0]));
}

export async function getFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFavoriteSlugs(userId: string): Promise<Set<string>> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { productSlug: true },
  });
  return new Set(rows.map((r) => r.productSlug));
}

export async function isFavorited(userId: string, productSlug: string) {
  const row = await prisma.favorite.findUnique({
    where: { userId_productSlug: { userId, productSlug } },
  });
  return Boolean(row);
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function getDashboardCounts(userId: string) {
  const [orders, favorites, unread] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { orders, favorites, unread };
}
