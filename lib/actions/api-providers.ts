"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/auth/session";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { invalidateProviderCache } from "@/lib/gameapi/provider-config";
import {
  syncGenericProviderGames,
  syncGenericProviderCatalogue,
  GenericProviderError,
} from "@/lib/gameapi/generic-provider";
import { createProductForGame } from "@/lib/gameapi/create-product";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}
function path(locale: Locale) {
  return `/${locale}/admin/api-providers`;
}
function providerPath(locale: Locale, key: string) {
  return `/${locale}/admin/api-providers/${key}`;
}

export type ApiProviderState = { ok: boolean; code?: string };

const AUTH_METHODS = ["API_KEY_HEADER", "BEARER_TOKEN", "BASIC_AUTH", "QUERY_PARAM"] as const;

const providerSchema = z.object({
  key: z.string().trim().min(2).max(40).regex(/^[a-z0-9\-]+$/),
  name: z.string().trim().min(1).max(80),
  baseUrl: z.string().trim().url(),
  apiKey: z.string().trim().max(500).optional(),
  authMethod: z.enum(AUTH_METHODS),
  authHeaderName: z.string().trim().max(80).optional(),
  testPath: z.string().trim().max(200).optional(),
  webhookSecret: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

// Registering a new provider's credentials here does NOT by itself make it
// place orders — an adapter that speaks its actual API still needs writing
// (see lib/gameapi/). It does immediately give an admin a place to store and
// edit that provider's config, test connectivity, and see errors, which is
// the reusable part across every provider.
export async function createApiProvider(
  _prev: ApiProviderState,
  formData: FormData,
): Promise<ApiProviderState> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };

  const parsed = providerSchema.safeParse({
    key: formData.get("key"),
    name: formData.get("name"),
    baseUrl: formData.get("baseUrl"),
    apiKey: formData.get("apiKey") || undefined,
    authMethod: formData.get("authMethod"),
    authHeaderName: formData.get("authHeaderName") || undefined,
    testPath: formData.get("testPath") || undefined,
    webhookSecret: formData.get("webhookSecret") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const exists = await prisma.apiProvider.findUnique({ where: { key: parsed.data.key } });
  if (exists) return { ok: false, code: "key_taken" };

  await prisma.apiProvider.create({
    data: {
      ...parsed.data,
      testPath: parsed.data.testPath || "/games",
      webhookSecret: parsed.data.webhookSecret || randomBytes(16).toString("hex"),
      active: false,
    },
  });
  invalidateProviderCache();
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
  return { ok: true, code: "created" };
}

export async function updateApiProvider(
  _prev: ApiProviderState,
  formData: FormData,
): Promise<ApiProviderState> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, code: "invalid_input" };

  const parsed = providerSchema.omit({ key: true }).safeParse({
    name: formData.get("name"),
    baseUrl: formData.get("baseUrl"),
    apiKey: formData.get("apiKey") || undefined,
    authMethod: formData.get("authMethod"),
    authHeaderName: formData.get("authHeaderName") || undefined,
    testPath: formData.get("testPath") || undefined,
    webhookSecret: formData.get("webhookSecret") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  // Blank apiKey in the edit form means "leave unchanged" — a provider row
  // with a real key already saved shouldn't get wiped just because the admin
  // didn't retype it (the field is masked/blank in the UI for that reason).
  const { apiKey, ...rest } = parsed.data;
  await prisma.apiProvider.update({
    where: { id },
    data: { ...rest, ...(apiKey ? { apiKey } : {}) },
  });
  invalidateProviderCache();
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
  return { ok: true, code: "saved" };
}

export async function toggleApiProviderActive(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "on";
  if (!id) return;
  await prisma.apiProvider.update({ where: { id }, data: { active } });
  invalidateProviderCache();
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
}

export async function deleteApiProvider(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // Never delete the built-in g2bulk row — the live integration resolves it
  // by key and would otherwise silently re-create it on the next request.
  const provider = await prisma.apiProvider.findUnique({ where: { id } });
  if (!provider || provider.key === "g2bulk") return;
  await prisma.apiProvider.delete({ where: { id } });
  invalidateProviderCache();
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
}

// Generic "does this baseUrl+key actually respond" check — GETs testPath
// with the configured auth applied and reports success/failure. Doesn't
// understand the response body (every provider's shape differs), just the
// HTTP status, which is enough to catch a wrong key/URL/auth method.
export async function testApiProviderConnection(
  _prev: ApiProviderState,
  formData: FormData,
): Promise<ApiProviderState> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, code: "invalid_input" };

  const provider = await prisma.apiProvider.findUnique({ where: { id } });
  if (!provider) return { ok: false, code: "not_found" };

  const url = new URL(`${provider.baseUrl.replace(/\/$/, "")}${provider.testPath}`);
  const headers: Record<string, string> = {};
  if (provider.apiKey) {
    switch (provider.authMethod) {
      case "API_KEY_HEADER":
        headers[provider.authHeaderName || "X-API-Key"] = provider.apiKey;
        break;
      case "BEARER_TOKEN":
        headers[provider.authHeaderName || "Authorization"] = `Bearer ${provider.apiKey}`;
        break;
      case "BASIC_AUTH":
        headers[provider.authHeaderName || "Authorization"] =
          `Basic ${Buffer.from(provider.apiKey).toString("base64")}`;
        break;
      case "QUERY_PARAM":
        url.searchParams.set("api_key", provider.apiKey);
        break;
    }
  }

  let ok = false;
  let message = "";
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
    ok = res.ok;
    message = ok ? `HTTP ${res.status} OK` : `HTTP ${res.status} ${res.statusText}`;
  } catch (e) {
    message = e instanceof Error ? e.message : "Request failed";
  }

  await prisma.apiProvider.update({
    where: { id },
    data: { lastTestedAt: new Date(), lastTestOk: ok, lastTestMessage: message },
  });
  invalidateProviderCache();
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
  return { ok, code: message };
}

// ---------------------------------------------------------------------------
// Generic catalogue browsing — see lib/gameapi/generic-provider.ts. Config
// for how to list THIS provider's products and their priced sub-items, kept
// separate from the connection-credentials form above since it's a distinct
// concern (and most providers never need more than the fields above).
// ---------------------------------------------------------------------------

const browseConfigSchema = z.object({
  listEndpoint: z.string().trim().max(300).optional(),
  listMethod: z.enum(["GET", "POST"]).default("GET"),
  itemsPath: z.string().trim().max(200).optional(),
  itemIdField: z.string().trim().min(1).max(100).default("code"),
  itemNameField: z.string().trim().min(1).max(100).default("name"),
  itemImageField: z.string().trim().max(100).optional(),
  catalogueEndpoint: z.string().trim().max(300).optional(),
  catalogueMethod: z.enum(["GET", "POST"]).default("GET"),
  catalogueItemsPath: z.string().trim().max(200).optional(),
  catalogueIdField: z.string().trim().min(1).max(100).default("id"),
  catalogueNameField: z.string().trim().min(1).max(100).default("name"),
  catalogueAmountField: z.string().trim().min(1).max(100).default("amount"),
});

export async function updateProviderBrowseConfig(
  _prev: ApiProviderState,
  formData: FormData,
): Promise<ApiProviderState> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const id = String(formData.get("id") ?? "");
  const key = String(formData.get("key") ?? "");
  if (!id) return { ok: false, code: "invalid_input" };

  const parsed = browseConfigSchema.safeParse({
    listEndpoint: formData.get("listEndpoint") || undefined,
    listMethod: formData.get("listMethod") || undefined,
    itemsPath: formData.get("itemsPath") || undefined,
    itemIdField: formData.get("itemIdField") || undefined,
    itemNameField: formData.get("itemNameField") || undefined,
    itemImageField: formData.get("itemImageField") || undefined,
    catalogueEndpoint: formData.get("catalogueEndpoint") || undefined,
    catalogueMethod: formData.get("catalogueMethod") || undefined,
    catalogueItemsPath: formData.get("catalogueItemsPath") || undefined,
    catalogueIdField: formData.get("catalogueIdField") || undefined,
    catalogueNameField: formData.get("catalogueNameField") || undefined,
    catalogueAmountField: formData.get("catalogueAmountField") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  await prisma.apiProvider.update({ where: { id }, data: parsed.data });
  invalidateProviderCache();
  revalidatePath(providerPath(loc(String(formData.get("locale") ?? "")), key));
  return { ok: true, code: "saved" };
}

export type GenericSyncState = { ok: boolean; code?: string; count?: number };

export async function syncProviderGamesAction(
  _prev: GenericSyncState,
  formData: FormData,
): Promise<GenericSyncState> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const providerId = String(formData.get("providerId") ?? "");
  const key = String(formData.get("key") ?? "");
  if (!providerId) return { ok: false, code: "invalid_input" };

  try {
    const count = await syncGenericProviderGames(providerId);
    revalidatePath(providerPath(loc(String(formData.get("locale") ?? "")), key));
    return { ok: true, code: "synced", count };
  } catch (e) {
    return { ok: false, code: e instanceof GenericProviderError ? e.message : "server_error" };
  }
}

export async function syncProviderCatalogueAction(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) return;
  const gameId = String(formData.get("gameId") ?? "");
  const key = String(formData.get("key") ?? "");
  if (!gameId) return;
  try {
    await syncGenericProviderCatalogue(gameId);
  } catch (e) {
    console.error("[syncProviderCatalogueAction] failed:", e);
  }
  revalidatePath(providerPath(loc(String(formData.get("locale") ?? "")), key));
}

// Same as lib/actions/gameapi.ts's createProductFromGame, just revalidating
// this provider's own page instead of /admin/gameapi — createProductForGame
// itself already doesn't care which provider synced the game.
export async function createProductFromProviderGame(
  _prev: GenericSyncState,
  formData: FormData,
): Promise<GenericSyncState> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const gameId = String(formData.get("gameId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const key = String(formData.get("key") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  if (!gameId || !categoryId) return { ok: false, code: "invalid_input" };

  const result = await createProductForGame(gameId, categoryId);
  updateTag("products");
  revalidatePath(providerPath(locale, key));
  if (!result.ok) {
    console.error("[createProductFromProviderGame] failed:", result.reason);
    return { ok: false, code: result.reason };
  }
  redirect(`/${locale}/admin/products/${result.productId}`);
}
