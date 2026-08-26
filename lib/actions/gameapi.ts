"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { syncGames, syncCatalogue } from "@/lib/gameapi/sync";
import { getFields, getServers, G2BulkError } from "@/lib/gameapi/client";
import { createProductForGame } from "@/lib/gameapi/create-product";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}
async function requireAdminUser() {
  const user = await getSessionUser();
  return user && user.role === "ADMIN" ? user : null;
}
function path(locale: Locale) {
  return `/${locale}/admin/gameapi`;
}

export type GameApiState = { ok: boolean; code?: string; count?: number };

// --- Enable/disable the whole integration -----------------------------------

export async function toggleGameApiEnabled(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const enabled = formData.get("enabled") === "on";
  await prisma.storeSettings.upsert({
    where: { id: "store" },
    update: { gameApiEnabled: enabled },
    create: { id: "store", gameApiEnabled: enabled },
  });
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
}

// --- Sync ---------------------------------------------------------------

export async function syncGamesAction(
  _prev: GameApiState,
  formData: FormData,
): Promise<GameApiState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  try {
    const count = await syncGames();
    revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
    return { ok: true, code: "synced", count };
  } catch (e) {
    console.error("[syncGamesAction] failed:", e);
    return { ok: false, code: e instanceof G2BulkError ? "provider_error" : "server_error" };
  }
}

export async function syncCatalogueAction(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const gameCode = String(formData.get("gameCode") ?? "");
  if (!gameCode) return;
  try {
    await syncCatalogue(gameCode);
  } catch (e) {
    console.error("[syncCatalogueAction] failed:", e);
  }
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
}

// --- Game <-> Product mapping ------------------------------------------------

export async function linkGameToProduct(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const gameId = String(formData.get("gameId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!gameId) return;
  await prisma.gameApiGame.update({
    where: { id: gameId },
    data: { productId: productId || null },
  });
  updateTag("products");
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
}

export async function toggleGameActive(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const gameId = String(formData.get("gameId") ?? "");
  const active = formData.get("active") === "on";
  if (!gameId) return;
  await prisma.gameApiGame.update({ where: { id: gameId }, data: { active } });
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
}

// --- Catalogue <-> Package mapping -------------------------------------------

export async function mapCatalogueToPackage(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const catalogueId = String(formData.get("catalogueId") ?? "");
  const packageId = String(formData.get("packageId") ?? "");
  if (!catalogueId) return;

  await prisma.$transaction(async (tx) => {
    // packageId is unique across GameApiCatalogue — a package can only ever
    // auto-fulfil through one denomination. Clear it off whichever other row
    // (if any) currently holds it before assigning it here.
    if (packageId) {
      await tx.gameApiCatalogue.updateMany({
        where: { packageId, NOT: { id: catalogueId } },
        data: { packageId: null },
      });
    }
    await tx.gameApiCatalogue.update({
      where: { id: catalogueId },
      data: { packageId: packageId || null },
    });
  });

  updateTag("products");
  revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
  const gameCode = String(formData.get("gameCode") ?? "");
  if (gameCode) revalidatePath(`${path(loc(String(formData.get("locale") ?? "")))}/${gameCode}`);
}

// --- Create a store Product straight from a synced game ---------------------
// One click: makes the product, one package per provider denomination, links
// everything back (game<->product, catalogue<->package), and adds the
// checkout fields it needs. See lib/gameapi/create-product.ts for the shared
// logic — also used by the bulk "Create all" action below.

export async function createProductFromGame(formData: FormData) {
  if (!(await requireAdminUser())) return;
  const gameId = String(formData.get("gameId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  if (!gameId || !categoryId) return;

  const result = await createProductForGame(gameId, categoryId);
  updateTag("products");
  revalidatePath(path(locale));
  if (!result.ok) {
    console.error("[createProductFromGame] failed:", result.reason);
    return;
  }
  redirect(`/${locale}/admin/products/${result.productId}`);
}

// Bulk version: creates a product for every currently-active, not-yet-linked
// game (skipping ones the provider has no packages for). Runs sequentially
// so one game's failure never aborts the rest — each is independent.
export async function createAllProductsAction(
  _prev: GameApiState,
  formData: FormData,
): Promise<GameApiState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const categoryId = String(formData.get("categoryId") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  if (!categoryId) return { ok: false, code: "invalid_input" };

  const games = await prisma.gameApiGame.findMany({
    where: { active: true, productId: null },
    select: { id: true, code: true },
  });

  let created = 0;
  for (const g of games) {
    const result = await createProductForGame(g.id, categoryId);
    if (result.ok) created++;
    else console.error(`[createAllProductsAction] skipped ${g.code}:`, result.reason);
  }

  updateTag("products");
  revalidatePath(path(locale));
  return created > 0 ? { ok: true, code: "synced", count: created } : { ok: false, code: "sync_failed" };
}

// --- Auto-create the checkout fields a game needs (Player ID / Server /
// Character name) as custom ProductInput rows, using G2Bulk's own
// /v1/games/fields + /v1/games/servers for that game. Reuses the "playerId"
// / "server" keys the store's automatic per-category fields already use
// (lib/data/catalog-generate.ts), so a custom row here simply overrides —
// with the right required flag — rather than duplicating a field.
// -----------------------------------------------------------------------

const FIELD_DEFAULTS = {
  playerId: {
    labelEn: "Player ID",
    labelAr: "معرّف اللاعب (ID)",
    placeholderEn: "Enter your Player ID",
    placeholderAr: "أدخل معرّف اللاعب",
  },
  server: {
    labelEn: "Server / Zone",
    labelAr: "السيرفر / الزون",
    placeholderEn: "e.g. America",
    placeholderAr: "مثال: America",
  },
  charname: {
    labelEn: "In-game character name",
    labelAr: "اسم الشخصية داخل اللعبة",
    placeholderEn: "Enter your character name",
    placeholderAr: "أدخل اسم الشخصية",
  },
} as const;

async function upsertInput(
  productId: string,
  key: keyof typeof FIELD_DEFAULTS,
  required: boolean,
  existingCount: number,
) {
  const d = FIELD_DEFAULTS[key];
  const existing = await prisma.productInput.findFirst({ where: { productId, key } });
  if (existing) {
    await prisma.productInput.update({ where: { id: existing.id }, data: { required } });
  } else {
    await prisma.productInput.create({
      data: {
        productId,
        key,
        labelEn: d.labelEn,
        labelAr: d.labelAr,
        placeholderEn: d.placeholderEn,
        placeholderAr: d.placeholderAr,
        kind: "text",
        required,
        sortOrder: existingCount,
      },
    });
  }
}

export async function syncFieldsAction(
  _prev: GameApiState,
  formData: FormData,
): Promise<GameApiState> {
  if (!(await requireAdminUser())) return { ok: false, code: "requires_auth" };
  const gameCode = String(formData.get("gameCode") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!gameCode || !productId) return { ok: false, code: "invalid_input" };

  try {
    const [fields, servers] = await Promise.all([getFields(gameCode), getServers(gameCode)]);
    const count = await prisma.productInput.count({ where: { productId } });

    await upsertInput(productId, "playerId", true, count);
    await upsertInput(productId, "server", servers !== null, count + 1);

    const needsCharname = fields.info.fields.some((f) => /char/i.test(f));
    if (needsCharname) await upsertInput(productId, "charname", true, count + 2);

    revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/products/${productId}`);
    revalidatePath(path(loc(String(formData.get("locale") ?? ""))));
    updateTag("products");
    return { ok: true, code: "fields_synced" };
  } catch (e) {
    console.error("[syncFieldsAction] failed:", e);
    return { ok: false, code: e instanceof G2BulkError ? "provider_error" : "server_error" };
  }
}
