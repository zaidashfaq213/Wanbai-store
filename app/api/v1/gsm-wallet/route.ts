import { prisma } from "@/lib/db";
import { ok, withAuth } from "@/lib/api/core";

// Same shape as /api/v1/wallet, but for the separate USD GSM wallet.
export const GET = withAuth(async (_req, user) => {
  const [transactions, submissions] = await Promise.all([
    prisma.gsmWalletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.paymentSubmission.findMany({
      where: { userId: user.id, purpose: "GSM_TOPUP" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { bankAccount: { select: { nameEn: true, nameAr: true } } },
    }),
  ]);
  return ok({ balance: user.gsmWalletBalance, transactions, submissions });
});
