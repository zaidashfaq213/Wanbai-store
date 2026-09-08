import "server-only";
import { prisma } from "@/lib/db";
import type { ApiProvider } from "@prisma/client";

// Resolves G2Bulk's credentials/config from the ApiProvider table (admin-
// editable via /admin/api-providers) instead of hardcoded env vars — the
// first step toward supporting more than one top-up provider. The env vars
// (G2BULK_API_KEY / G2BULK_BASE_URL) still work as a fallback/seed so an
// existing deployment never breaks: the very first read here creates the
// "g2bulk" row from them if it doesn't exist yet, and any field an admin
// hasn't overridden in the DB (a blank apiKey/baseUrl) still falls back to
// its env var.

export const G2BULK_PROVIDER_KEY = "g2bulk";

let cached: { provider: ApiProvider; at: number } | null = null;
const CACHE_MS = 15_000; // short TTL: config changes in the admin panel should take effect fast

export async function getG2BulkProvider(): Promise<ApiProvider> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.provider;

  let provider = await prisma.apiProvider.findUnique({ where: { key: G2BULK_PROVIDER_KEY } });
  if (!provider) {
    // First run after this migration — seed a row from whatever's in .env so
    // behavior is identical to before until an admin edits it in the panel.
    const settings = await prisma.storeSettings.findUnique({ where: { id: "store" } });
    provider = await prisma.apiProvider.create({
      data: {
        key: G2BULK_PROVIDER_KEY,
        name: "G2Bulk",
        baseUrl: process.env.G2BULK_BASE_URL || "https://api.g2bulk.com/v1",
        apiKey: process.env.G2BULK_API_KEY || null,
        authMethod: "API_KEY_HEADER",
        authHeaderName: "X-API-Key",
        testPath: "/games",
        active: settings?.gameApiEnabled ?? false,
      },
    });
  }
  cached = { provider, at: Date.now() };
  return provider;
}

export function invalidateProviderCache() {
  cached = null;
}

export type ResolvedConfig = {
  baseUrl: string;
  apiKey: string | null;
  authMethod: ApiProvider["authMethod"];
  authHeaderName: string | null;
};

export async function resolveG2BulkConfig(): Promise<ResolvedConfig> {
  const provider = await getG2BulkProvider();
  return {
    baseUrl: (provider.baseUrl || process.env.G2BULK_BASE_URL || "https://api.g2bulk.com/v1").replace(/\/$/, ""),
    apiKey: provider.apiKey || process.env.G2BULK_API_KEY || null,
    authMethod: provider.authMethod,
    authHeaderName: provider.authHeaderName,
  };
}

export async function isG2BulkActive(): Promise<boolean> {
  const provider = await getG2BulkProvider();
  return Boolean(provider.active && (provider.apiKey || process.env.G2BULK_API_KEY));
}

/** Fire-and-forget — records the most recent error so the admin panel can show it. */
export async function recordProviderError(message: string): Promise<void> {
  try {
    await prisma.apiProvider.update({
      where: { key: G2BULK_PROVIDER_KEY },
      data: { lastErrorAt: new Date(), lastErrorMessage: message.slice(0, 2000) },
    });
    invalidateProviderCache();
  } catch {
    // Never let logging a provider error itself throw.
  }
}

export async function recordProviderTest(ok: boolean, message: string): Promise<void> {
  await prisma.apiProvider.update({
    where: { key: G2BULK_PROVIDER_KEY },
    data: { lastTestedAt: new Date(), lastTestOk: ok, lastTestMessage: message.slice(0, 2000) },
  });
  invalidateProviderCache();
}

/** Builds the auth header/query for a request per the provider's configured method. */
export function applyAuth(
  config: ResolvedConfig,
  url: URL,
  headers: Record<string, string>,
): void {
  if (!config.apiKey) return;
  switch (config.authMethod) {
    case "API_KEY_HEADER":
      headers[config.authHeaderName || "X-API-Key"] = config.apiKey;
      break;
    case "BEARER_TOKEN":
      headers[config.authHeaderName || "Authorization"] = `Bearer ${config.apiKey}`;
      break;
    case "BASIC_AUTH":
      headers[config.authHeaderName || "Authorization"] =
        `Basic ${Buffer.from(config.apiKey).toString("base64")}`;
      break;
    case "QUERY_PARAM":
      url.searchParams.set("api_key", config.apiKey);
      break;
  }
}
