import "server-only";
import { prisma } from "@/lib/db";
import { getG2BulkProvider } from "@/lib/gameapi/provider-config";

// Admin-facing reads for /admin/api-providers. Ensures the "g2bulk" row
// exists (self-heals from env vars on first call — see provider-config.ts)
// so the list is never empty on a fresh deploy.
export async function getAllApiProviders() {
  await getG2BulkProvider();
  return prisma.apiProvider.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { games: true } } },
  });
}

export async function getApiProviderByKey(key: string) {
  return prisma.apiProvider.findUnique({ where: { key } });
}

// Games/products synced under one provider — powers the generic "Browse &
// Create" page (lib/gameapi/generic-provider.ts populates these rows).
export async function getProviderGames(providerId: string) {
  return prisma.gameApiGame.findMany({
    where: { providerId },
    orderBy: { nameEn: "asc" },
    include: {
      product: { select: { id: true, nameEn: true, nameAr: true } },
      _count: { select: { catalogues: true } },
    },
  });
}

export async function getProviderGameDetail(gameId: string) {
  return prisma.gameApiGame.findUnique({
    where: { id: gameId },
    include: {
      catalogues: { orderBy: { amount: "asc" }, include: { package: true } },
      product: {
        include: {
          variantGroups: {
            orderBy: { sortOrder: "asc" },
            include: { packages: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });
}

export async function getApiProviderErrorLog(providerId: string, take = 10) {
  // Recent FAILED provider orders for games under this provider — the
  // per-order detail (GameApiOrder.errorMessage) alongside the provider-
  // level lastErrorMessage rollup.
  return prisma.gameApiOrder.findMany({
    where: { status: "FAILED", errorMessage: { not: null } },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      orderItem: { select: { productName: true, packageLabel: true, order: { select: { ref: true } } } },
    },
  });
}
