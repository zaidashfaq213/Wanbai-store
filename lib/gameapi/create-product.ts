import "server-only";
import { prisma } from "@/lib/db";
import { buildDetail } from "@/lib/data/catalog-generate";
import { syncCatalogue } from "@/lib/gameapi/sync";
import { getFields, getServers } from "@/lib/gameapi/client";

// One-shot markup applied to the provider's cost price to get a starting
// sell price — not final, the admin can edit any package price afterward
// via the normal product editor.
const AUTO_MARKUP = 1.25;
const cents = (usd: number) => Math.round(usd * 100);

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
  sortOrder: number,
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
        sortOrder,
      },
    });
  }
}

export type CreateProductResult =
  | { ok: true; productId: string; slug: string }
  | { ok: false; reason: string };

/**
 * One click: makes a Product from a synced provider game, one package per
 * denomination (priced at cost + AUTO_MARKUP), links every package back to
 * its catalogue row, links the game to the new product, and adds the
 * checkout fields it needs (Player ID / Server / Character name) — fully
 * mapped and ready to sell.
 *
 * Used by both the single-row "Create product" button and the "Create all"
 * bulk action (lib/actions/gameapi.ts).
 */
export async function createProductForGame(
  gameId: string,
  categoryId: string,
): Promise<CreateProductResult> {
  const game = await prisma.gameApiGame.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, reason: "Game not found" };
  if (game.productId) return { ok: false, reason: "Already linked to a product" };

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return { ok: false, reason: "Category not found" };

  let catalogues = await prisma.gameApiCatalogue.findMany({ where: { gameApiGameId: gameId } });
  if (catalogues.length === 0) {
    try {
      await syncCatalogue(game.code);
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : "Catalogue sync failed" };
    }
    catalogues = await prisma.gameApiCatalogue.findMany({ where: { gameApiGameId: gameId } });
  }
  if (catalogues.length === 0) return { ok: false, reason: "No packages available for this game" };

  const baseSlug = game.code.replace(/_/g, "-").toLowerCase();
  let slug = baseSlug;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const sorted = [...catalogues].sort((a, b) => a.amount - b.amount);
  const initial = game.nameEn.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "GA";

  const detail = buildDetail({
    slug,
    name: { en: game.nameEn, ar: game.nameEn },
    category: category.slug,
    badge: { en: "Instant", ar: "تسليم فوري" },
    initial,
    hue: 280,
    priceFrom: sorted[0].amount * AUTO_MARKUP,
    rating: 5,
    reviews: 0,
  });

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        slug,
        categoryId: category.id,
        nameEn: game.nameEn,
        nameAr: game.nameEn, // no Arabic name from the provider — edit as needed
        badgeEn: "Instant",
        badgeAr: "تسليم فوري",
        initial,
        priceFrom: cents(sorted[0].amount * AUTO_MARKUP),
        image: game.imageUrl,
        active: true,
        fulfillment: "TOPUP",
        overviewEn: detail.overview.en,
        overviewAr: detail.overview.ar,
        howToUseEn: detail.howToUse.en,
        howToUseAr: detail.howToUse.ar,
        ratingBreakdown: [0, 0, 0, 0, 0],
        variantGroups: {
          create: {
            nameEn: "Top-up",
            nameAr: "شحن",
            sortOrder: 0,
            packages: {
              create: sorted.map((c, i) => ({
                labelEn: c.name,
                labelAr: c.name,
                price: cents(c.amount * AUTO_MARKUP),
                sortOrder: i,
              })),
            },
          },
        },
        faqs: {
          create: detail.faqs.map((f, fi) => ({
            qEn: f.q.en,
            qAr: f.q.ar,
            aEn: f.a.en,
            aAr: f.a.ar,
            sortOrder: fi,
          })),
        },
      },
      include: {
        variantGroups: { include: { packages: { orderBy: { sortOrder: "asc" } } } },
      },
    });

    await tx.gameApiGame.update({ where: { id: game.id }, data: { productId: created.id } });

    const createdPackages = created.variantGroups[0].packages;
    for (let i = 0; i < sorted.length; i++) {
      await tx.gameApiCatalogue.update({
        where: { id: sorted[i].id },
        data: { packageId: createdPackages[i].id },
      });
    }
    return created;
  });

  // Best-effort — a failure here doesn't undo the product; the admin can
  // still add these manually via "Sync required fields".
  try {
    const [fields, servers] = await Promise.all([getFields(game.code), getServers(game.code)]);
    await upsertInput(product.id, "playerId", true, 0);
    await upsertInput(product.id, "server", servers !== null, 1);
    if (fields.info.fields.some((f) => /char/i.test(f))) {
      await upsertInput(product.id, "charname", true, 2);
    }
  } catch (e) {
    console.error(`[createProductForGame] field sync failed for ${game.code}:`, e);
  }

  return { ok: true, productId: product.id, slug: product.slug };
}
