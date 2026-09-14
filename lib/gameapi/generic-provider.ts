import "server-only";
import { prisma } from "@/lib/db";
import type { ApiProvider } from "@prisma/client";
import { applyAuth, recordProviderErrorFor } from "./provider-config";

// Generic, config-driven catalogue browsing for ANY provider registered in
// /admin/api-providers — no bespoke code needed to LIST a provider's
// products/games and their priced sub-items (denominations/variants/plans),
// as long as its API is a plain JSON REST endpoint. Writes into the same
// GameApiGame/GameApiCatalogue tables G2Bulk already uses, so everything
// downstream (package mapping, "Create Product", pricing) just works
// unchanged — see lib/gameapi/create-product.ts.
//
// What this can't generalize: placing an order through the provider and
// handling its delivery/webhook — those need a real adapter per provider
// (see lib/gameapi/client.ts for G2Bulk's), because every provider's order
// contract is genuinely different. This file only ever reads.

export class GenericProviderError extends Error {}

function getPath(obj: unknown, path: string | null | undefined): unknown {
  if (!path) return obj;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

async function genericRequest(provider: ApiProvider, path: string, method: string): Promise<unknown> {
  const url = new URL(`${provider.baseUrl.replace(/\/$/, "")}${path}`);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  applyAuth(
    {
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      authMethod: provider.authMethod,
      authHeaderName: provider.authHeaderName,
    },
    url,
    headers,
  );

  let res: Response;
  try {
    res = await fetch(url, { method, headers, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network request failed";
    void recordProviderErrorFor(provider.id, message);
    throw new GenericProviderError(message);
  }
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const message = "Response wasn't valid JSON";
    void recordProviderErrorFor(provider.id, message);
    throw new GenericProviderError(message);
  }
  if (!res.ok) {
    const message = `Provider request failed (HTTP ${res.status})`;
    void recordProviderErrorFor(provider.id, message);
    throw new GenericProviderError(message);
  }
  return data;
}

/** Pull the provider's top-level product/game list using its configured
 * listEndpoint + field mappings, upserting into GameApiGame. */
export async function syncGenericProviderGames(providerId: string): Promise<number> {
  const provider = await prisma.apiProvider.findUnique({ where: { id: providerId } });
  if (!provider) throw new GenericProviderError("Provider not found");
  if (!provider.listEndpoint) {
    throw new GenericProviderError("List endpoint isn't configured for this provider yet");
  }

  const data = await genericRequest(provider, provider.listEndpoint, provider.listMethod);
  const items = getPath(data, provider.itemsPath) ?? data;
  if (!Array.isArray(items)) {
    throw new GenericProviderError(
      `Configured "items path" didn't resolve to a list (got ${typeof items})`,
    );
  }

  let count = 0;
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const code = getPath(item, provider.itemIdField);
    const name = getPath(item, provider.itemNameField);
    if (code == null) continue;
    const codeStr = String(code);
    const imageUrl = provider.itemImageField ? getPath(item, provider.itemImageField) : null;

    await prisma.gameApiGame.upsert({
      where: { code: codeStr },
      update: {
        nameEn: name != null ? String(name) : codeStr,
        imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
        providerId: provider.id,
        lastSyncedAt: new Date(),
      },
      create: {
        code: codeStr,
        nameEn: name != null ? String(name) : codeStr,
        imageUrl: typeof imageUrl === "string" ? imageUrl : null,
        providerId: provider.id,
        lastSyncedAt: new Date(),
      },
    });
    count++;
  }
  return count;
}

/** Pull one game's priced sub-items (denominations/variants/plans) using the
 * provider's configured catalogueEndpoint pattern, upserting into
 * GameApiCatalogue — same shape G2Bulk's syncCatalogue() produces. */
export async function syncGenericProviderCatalogue(gameId: string): Promise<number> {
  const game = await prisma.gameApiGame.findUnique({ where: { id: gameId }, include: { provider: true } });
  if (!game) throw new GenericProviderError("Game not found");
  const provider = game.provider;
  if (!provider) throw new GenericProviderError("This game has no provider linked");
  if (!provider.catalogueEndpoint) {
    throw new GenericProviderError("Catalogue endpoint isn't configured for this provider yet");
  }

  const path = provider.catalogueEndpoint.replace("{id}", encodeURIComponent(game.code));
  const data = await genericRequest(provider, path, provider.catalogueMethod);
  const items = getPath(data, provider.catalogueItemsPath) ?? data;
  if (!Array.isArray(items)) {
    throw new GenericProviderError(
      `Configured "catalogue items path" didn't resolve to a list (got ${typeof items})`,
    );
  }

  let count = 0;
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const rawId = getPath(item, provider.catalogueIdField);
    const name = getPath(item, provider.catalogueNameField);
    const amount = getPath(item, provider.catalogueAmountField);
    if (rawId == null || amount == null) continue;
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum)) continue;
    // providerCatalogueId is an Int (matches G2Bulk's numeric catalogue ids)
    // — a provider whose ids aren't numeric needs its own adapter, this
    // can't be generalized further without changing that column's type.
    const idNum = Number(rawId);
    const providerCatalogueId = Number.isFinite(idNum) ? idNum : hashToInt(String(rawId));

    await prisma.gameApiCatalogue.upsert({
      where: { gameApiGameId_providerCatalogueId: { gameApiGameId: game.id, providerCatalogueId } },
      update: { name: name != null ? String(name) : String(rawId), amount: amountNum, lastSyncedAt: new Date() },
      create: {
        gameApiGameId: game.id,
        providerCatalogueId,
        name: name != null ? String(name) : String(rawId),
        amount: amountNum,
      },
    });
    count++;
  }
  await prisma.gameApiGame.update({ where: { id: game.id }, data: { lastSyncedAt: new Date() } });
  return count;
}

// Deterministic fallback when a catalogue item's id isn't numeric (e.g. a
// slug) — providerCatalogueId only needs to be stable and unique per game,
// not meaningful outside this table.
function hashToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}
