// Optional demo seed — creates a test account you can log in with.
// Run after migrating:  npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STATIC_CATEGORIES, STATIC_PRODUCTS } from "../lib/data/catalog-static.ts";
import { buildDetail, FULFILLMENT } from "../lib/data/catalog-generate.ts";

const prisma = new PrismaClient();

const cents = (usd: number) => Math.round(usd * 100);
const FULFILL_ENUM = { topup: "TOPUP", code: "CODE", service: "SERVICE" } as const;

async function seedCatalog() {
  // Categories
  const categoryIdBySlug = new Map<string, string>();
  for (let i = 0; i < STATIC_CATEGORIES.length; i++) {
    const c = STATIC_CATEGORIES[i];
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        nameEn: c.name.en,
        nameAr: c.name.ar,
        icon: c.icon,
        gradient: c.gradient,
        sortOrder: i,
      },
    });
    categoryIdBySlug.set(c.slug, row.id);
  }

  // Products + their materialised detail (variant groups, packages, inputs, faqs, reviews)
  for (let i = 0; i < STATIC_PRODUCTS.length; i++) {
    const p = STATIC_PRODUCTS[i];
    const categoryId = categoryIdBySlug.get(p.category);
    if (!categoryId) continue;
    const detail = buildDetail(p);

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue; // don't overwrite admin edits on re-seed

    await prisma.product.create({
      data: {
        slug: p.slug,
        categoryId,
        nameEn: p.name.en,
        nameAr: p.name.ar,
        badgeEn: p.badge.en,
        badgeAr: p.badge.ar,
        initial: p.initial,
        hue: p.hue,
        priceFrom: cents(p.priceFrom),
        rating: p.rating,
        reviewCount: p.reviews,
        image: p.image ?? null,
        fulfillment: FULFILL_ENUM[FULFILLMENT[p.category] ?? "code"],
        overviewEn: detail.overview.en,
        overviewAr: detail.overview.ar,
        howToUseEn: detail.howToUse.en,
        howToUseAr: detail.howToUse.ar,
        ratingBreakdown: detail.ratingBreakdown,
        sortOrder: i,
        variantGroups: {
          create: detail.variantGroups.map((g, gi) => ({
            nameEn: g.name.en,
            nameAr: g.name.ar,
            sortOrder: gi,
            packages: {
              create: g.packages.map((pk, pi) => ({
                labelEn: pk.label.en,
                labelAr: pk.label.ar,
                sublabelEn: pk.sublabel?.en ?? null,
                sublabelAr: pk.sublabel?.ar ?? null,
                price: cents(pk.price),
                popular: pk.popular ?? false,
                sortOrder: pi,
              })),
            },
          })),
        },
        inputs: {
          create: detail.inputs.map((inp, ii) => ({
            key: inp.id,
            labelEn: inp.label.en,
            labelAr: inp.label.ar,
            placeholderEn: inp.placeholder.en,
            placeholderAr: inp.placeholder.ar,
            kind: inp.kind,
            required: inp.required ?? false,
            sortOrder: ii,
          })),
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
        reviews: {
          create: detail.reviews.map((r, ri) => ({
            name: r.name,
            rating: r.rating,
            commentEn: r.comment.en,
            commentAr: r.comment.ar,
            date: r.date,
            sortOrder: ri,
          })),
        },
      },
    });
  }
  console.log(
    `Seeded ${STATIC_CATEGORIES.length} categories and ${STATIC_PRODUCTS.length} products`,
  );
}

async function main() {
  const email = "demo@wanbai.store";
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      username: "demo",
      passwordHash,
      emailVerified: new Date(),
      preferredLocale: "ar",
      preferredCurrency: "USD",
      walletBalance: 2500, // $25.00
      walletTransactions: {
        create: { amount: 2500, type: "TOPUP", description: "Welcome credit" },
      },
      notifications: {
        create: {
          type: "SYSTEM",
          title: "Welcome to WANBAI-STORE 🎉",
          body: "Your demo account is ready. Explore the store!",
          href: "/dashboard",
        },
      },
    },
  });

  console.log(`Seeded demo user: ${user.email} / password123`);

  // Admin account for the back-office.
  const admin = await prisma.user.upsert({
    where: { email: "admin@wanbai.store" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@wanbai.store",
      name: "Store Admin",
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 12),
      emailVerified: new Date(),
      role: "ADMIN",
      preferredLocale: "ar",
    },
  });
  console.log(`Seeded admin user: ${admin.email} / admin123`);

  // Payout banks. Account numbers are placeholders — edit them in the admin
  // panel (Bank Accounts) with your real details.
  const banks = [
    {
      key: "o-cash",
      nameEn: "O-Cash",
      nameAr: "اوو-كاش",
      accountName: "WANBAI STORE",
      accountNumber: "0000 0000 0000",
      color: "#1c8a5a",
      sortOrder: 1,
    },
    {
      key: "mycashi",
      nameEn: "MyCashi",
      nameAr: "ماي كاشي",
      accountName: "WANBAI STORE",
      accountNumber: "0000 0000 0000",
      color: "#5b3fd1",
      sortOrder: 2,
    },
    {
      key: "bok",
      nameEn: "Bankak (BOK)",
      nameAr: "بنكك",
      accountName: "WANBAI STORE",
      accountNumber: "0000 0000 0000",
      color: "#d81f26",
      sortOrder: 3,
    },
  ];
  for (const b of banks) {
    await prisma.bankAccount.upsert({
      where: { key: b.key },
      update: {},
      create: b,
    });
  }
  console.log(`Seeded ${banks.length} bank accounts`);

  await seedCatalog();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
