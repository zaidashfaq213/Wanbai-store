import "server-only";
import { prisma } from "@/lib/db";
import { listGames, getCatalogue } from "./client";

/** Pull the full game list from the provider and upsert it into GameApiGame.
 * Never deletes a locally-mapped game the provider stops listing — it just
 * won't get refreshed further, so an admin doesn't lose a working mapping to
 * a transient provider hiccup. */
export async function syncGames(): Promise<number> {
  const { games } = await listGames();
  for (const g of games) {
    await prisma.gameApiGame.upsert({
      where: { code: g.code },
      update: { nameEn: g.name, imageUrl: g.image_url, lastSyncedAt: new Date() },
      create: {
        code: g.code,
        nameEn: g.name,
        imageUrl: g.image_url,
        lastSyncedAt: new Date(),
      },
    });
  }
  return games.length;
}

/** Pull current denominations + prices for one game and upsert them into
 * GameApiCatalogue. Call before placing an order too, if the price might be
 * stale — see lib/gameapi/order.ts. */
export async function syncCatalogue(gameCode: string): Promise<number> {
  const game = await prisma.gameApiGame.findUnique({ where: { code: gameCode } });
  if (!game) throw new Error(`Game "${gameCode}" hasn't been synced yet`);

  const { catalogues } = await getCatalogue(gameCode);
  for (const c of catalogues) {
    await prisma.gameApiCatalogue.upsert({
      where: {
        gameApiGameId_providerCatalogueId: {
          gameApiGameId: game.id,
          providerCatalogueId: c.id,
        },
      },
      update: { name: c.name, amount: c.amount, lastSyncedAt: new Date() },
      create: {
        gameApiGameId: game.id,
        providerCatalogueId: c.id,
        name: c.name,
        amount: c.amount,
      },
    });
  }
  await prisma.gameApiGame.update({
    where: { id: game.id },
    data: { lastSyncedAt: new Date() },
  });
  return catalogues.length;
}
