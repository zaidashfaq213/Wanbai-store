import { prisma } from "@/lib/db";
import { ok, withAuth } from "@/lib/api/core";

export const GET = withAuth(async (_req, user) => {
  const [transactions, submissions] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.paymentSubmission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { bankAccount: { select: { nameEn: true, nameAr: true } } },
    }),
  ]);
  return ok({ balance: user.walletBalance, transactions, submissions });
});
