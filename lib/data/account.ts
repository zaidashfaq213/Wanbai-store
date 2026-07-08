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
