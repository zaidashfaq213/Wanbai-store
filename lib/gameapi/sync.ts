import "server-only";
import { prisma } from "@/lib/db";
import { listGames, getCatalogue } from "./client";
import { getG2BulkProvider } from "./provider-config";

/** Pull the full game list from the provider and upsert it into GameApiGame.
 * Never deletes a locally-mapped game the provider stops listing — it just
 * won't get refreshed further, so an admin doesn't lose a working mapping to
 * a transient provider hiccup. */
export async function syncGames(): Promise<number> {
  const { games } = await listGames();
  // Same defensive fallback as syncCatalogue below — don't trust the
  // provider's response to always match its declared type.
  const list = games ?? [];
  // Tags every row as g2bulk's — matters now that GameApiGame can also be
  // populated by other providers (see /admin/api-providers/[key]), so their
  // rows never get mixed into this same, code-unique table without a clear
  // owner.
  const provider = await getG2BulkProvider();
  for (const g of list) {
    await prisma.gameApiGame.upsert({
      where: { code: g.code },
      update: { nameEn: g.name, imageUrl: g.image_url, providerId: provider.id, lastSyncedAt: new Date() },
      create: {
        code: g.code,
        nameEn: g.name,
        imageUrl: g.image_url,
        providerId: provider.id,
        lastSyncedAt: new Date(),
      },
    });
  }
  return list.length;
}

/** Pull current denominations + prices for one game and upsert them into
 * GameApiCatalogue. Call before placing an order too, if the price might be
 * stale — see lib/gameapi/order.ts. */
export async function syncCatalogue(gameCode: string): Promise<number> {
  const game = await prisma.gameApiGame.findUnique({ where: { code: gameCode } });
  if (!game) throw new Error(`Game "${gameCode}" hasn't been synced yet`);

  const { catalogues: raw } = await getCatalogue(gameCode);
  // The provider's response type claims `catalogues` is always an array, but
  // in practice a game with no denominations configured on their end can
  // come back with it missing/null instead of `[]` — trusting the type blew
  // up here with a cryptic "catalogues is not iterable" (and, further down,
  // "Cannot read properties of null (reading 'length')"), surfaced to the
  // admin as a blanket "sync failed" with no indication why. Normalise once
  // up front instead of crashing; the caller already handles a zero-package
  // result with a clear reason ("No packages available for this game").
  const catalogues = raw ?? [];
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
