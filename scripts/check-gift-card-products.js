// Checks whether these 8 gift-card/subscription products exist and are
// active on THIS server's database. Run from the project root:
//   node scripts/check-gift-card-products.js
require("@next/env").loadEnvConfig(process.cwd());
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SLUGS = ["google-play", "razer-gold", "xbox", "roblox", "playstation", "steam", "noon", "netflix"];

(async () => {
  for (const slug of SLUGS) {
    const p = await prisma.product.findUnique({
      where: { slug },
      select: { nameEn: true, active: true, available: true, priceFrom: true },
    });
    if (!p) {
      console.log(slug, "-> MISSING (not in this database)");
    } else {
      console.log(slug, "->", p.nameEn, "| active:", p.active, "| available:", p.available, "| priceFrom:", p.priceFrom / 100);
    }
  }
  const telegram = await prisma.product.findFirst({
    where: { nameEn: { contains: "telegram", mode: "insensitive" } },
    select: { slug: true, nameEn: true, active: true, fulfillment: true },
  });
  console.log("telegram (any slug) ->", telegram ?? "MISSING");
  await prisma.$disconnect();
})();
