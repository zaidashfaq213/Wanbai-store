import { prisma } from "@/lib/db";
import { ok, withAuth } from "@/lib/api/core";

export const GET = withAuth(async (_req, user) => {
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return ok({ notifications, unread });
});
