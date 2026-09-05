// Creates only the gift-card/subscription products that are missing on THIS
// server — skips any that already exist untouched (same "if (existing)
// continue" safety as prisma/seed.ts, so this is safe to run on production
// without risking any admin edits already made there).
// Run:  node --experimental-strip-types scripts/add-gift-card-products.ts
import { PrismaClient } from "@prisma/client";
import { buildDetail } from "../lib/data/catalog-generate.ts";

const prisma = new PrismaClient();
const cents = (usd: number) => Math.round(usd * 100);

type Spec = {
  slug: string;
  nameAr: string;
  nameEn: string;
  category: string;
  initial: string;
  hue: number;
  priceFrom: number;
  rating: number;
  reviews: number;
  badgeAr: string;
  badgeEn: string;
};

const PRODUCTS: Spec[] = [
  { slug: "steam", nameAr: "ستيم", nameEn: "Steam", category: "game-cards", initial: "S", hue: 210, priceFrom: 5.0, rating: 5.0, reviews: 64, badgeAr: "بطاقة رقمية", badgeEn: "Gift card" },
  { slug: "roblox", nameAr: "روبلوكس", nameEn: "Roblox", category: "game-cards", initial: "R", hue: 0, priceFrom: 4.5, rating: 4.9, reviews: 38, badgeAr: "بطاقة رقمية", badgeEn: "Gift card" },
  { slug: "playstation", nameAr: "بلايستيشن", nameEn: "PlayStation", category: "game-cards", initial: "PS", hue: 220, priceFrom: 10.0, rating: 5.0, reviews: 51, badgeAr: "بطاقة رقمية", badgeEn: "Gift card" },
  { slug: "xbox", nameAr: "اكس بوكس", nameEn: "Xbox", category: "game-cards", initial: "X", hue: 130, priceFrom: 10.0, rating: 4.8, reviews: 29, badgeAr: "بطاقة رقمية", badgeEn: "Gift card" },
  { slug: "razer-gold", nameAr: "رايزر جولد", nameEn: "Razer Gold", category: "game-cards", initial: "RG", hue: 50, priceFrom: 5.0, rating: 4.9, reviews: 24, badgeAr: "بطاقة رقمية", badgeEn: "Gift card" },
  { slug: "noon", nameAr: "نون", nameEn: "Noon", category: "shopping", initial: "N", hue: 45, priceFrom: 10.0, rating: 4.8, reviews: 16, badgeAr: "بطاقة رقمية", badgeEn: "Gift card" },
  { slug: "netflix", nameAr: "نتفليكس", nameEn: "Netflix", category: "app-subscriptions", initial: "N", hue: 358, priceFrom: 8.0, rating: 5.0, reviews: 49, badgeAr: "اشتراك", badgeEn: "Subscription" },
];

async function main() {
  for (const spec of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: spec.slug } });
    if (existing) {
      console.log(spec.slug, "-> already exists, skipped");
      continue;
    }

    const category = await prisma.category.findUnique({ where: { slug: spec.category } });
    if (!category) {
      console.log(spec.slug, `-> SKIPPED: category "${spec.category}" not found`);
      continue;
    }

    const detail = buildDetail({
      slug: spec.slug,
      name: { ar: spec.nameAr, en: spec.nameEn },
      category: spec.category,
      badge: { ar: spec.badgeAr, en: spec.badgeEn },
      initial: spec.initial,
      hue: spec.hue,
      priceFrom: spec.priceFrom,
      rating: spec.rating,
      reviews: spec.reviews,
    });

    const created = await prisma.product.create({
      data: {
        slug: spec.slug,
        categoryId: category.id,
        nameEn: spec.nameEn,
        nameAr: spec.nameAr,
        badgeEn: spec.badgeEn,
        badgeAr: spec.badgeAr,
        initial: spec.initial,
        hue: spec.hue,
        priceFrom: cents(spec.priceFrom),
        rating: spec.rating,
        reviewCount: spec.reviews,
        active: true,
        fulfillment: "CODE",
        overviewEn: detail.overview.en,
        overviewAr: detail.overview.ar,
        howToUseEn: detail.howToUse.en,
        howToUseAr: detail.howToUse.ar,
        ratingBreakdown: [0, 0, 0, 0, 0],
        variantGroups: {
          create: detail.variantGroups.map((g, gi) => ({
            nameEn: g.name.en,
            nameAr: g.name.ar,
            sortOrder: gi,
            packages: {
              create: g.packages.map((pk, pi) => ({
                labelEn: pk.label.en,
                labelAr: pk.label.ar,
                price: cents(pk.price),
                popular: pk.popular ?? false,
                sortOrder: pi,
              })),
            },
          })),
        },
        faqs: {
          create: detail.faqs.map((f, fi) => ({
            qEn: f.q.en, qAr: f.q.ar, aEn: f.a.en, aAr: f.a.ar, sortOrder: fi,
          })),
        },
      },
    });
    console.log(spec.slug, "-> created:", created.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
