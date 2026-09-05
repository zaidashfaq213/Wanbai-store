// One-off diagnostic: why didn't a recent gaming/top-up order reach G2Bulk?
// Run from the project root:  node scripts/diag-g2bulk-orders.js
require("@next/env").loadEnvConfig(process.cwd());
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  console.log("=== Global config ===");
  console.log("G2BULK_API_KEY set:", Boolean(process.env.G2BULK_API_KEY));
  const settings = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  console.log("StoreSettings.gameApiEnabled:", settings?.gameApiEnabled);
  console.log();

  console.log("=== Recent TOPUP order items (last 5 days) ===");
  const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const items = await prisma.orderItem.findMany({
    where: { deliveryType: "TOPUP", order: { createdAt: { gte: since } } },
    include: { order: { select: { ref: true, status: true, createdAt: true, email: true } }, gameApiOrder: true },
    orderBy: { order: { createdAt: "desc" } },
  });

  if (items.length === 0) {
    console.log("No TOPUP orders in the last 5 days.");
  }

  for (const it of items) {
    console.log("-----------------------------------");
    console.log("Order:", it.order.ref, "| status:", it.order.status, "| created:", it.order.createdAt.toISOString(), "| email:", it.order.email);
    console.log("Product:", it.productSlug, "| package:", it.packageLabel);
    console.log("Inputs:", JSON.stringify(it.inputs));

    if (it.gameApiOrder) {
      console.log("GameApiOrder found -> status:", it.gameApiOrder.status, "| providerOrderId:", it.gameApiOrder.providerOrderId, "| error:", it.gameApiOrder.errorMessage);
    } else {
      console.log("GameApiOrder: NONE (auto top-up was never attempted for this item)");

      // Figure out exactly why: find the live Package row this item came
      // from (by product+label, since OrderItem only stores a label snapshot)
      // and check its GameApiCatalogue mapping.
      const product = await prisma.product.findUnique({
        where: { slug: it.productSlug },
        include: { variantGroups: { include: { packages: true } } },
      });
      const pkg = product?.variantGroups
        .flatMap((g) => g.packages)
        .find((p) => p.labelEn === it.packageLabel || p.labelAr === it.packageLabel);

      if (!pkg) {
        console.log("  Reason: could not find a matching live Package for this label (package may have been renamed/deleted since).");
        continue;
      }
      const mapping = await prisma.gameApiCatalogue.findUnique({
        where: { packageId: pkg.id },
        include: { game: true },
      });
      if (!mapping) {
        console.log("  Reason: this package has NO Game API mapping (Admin -> Game API) -> falls back to manual fulfilment, by design.");
      } else if (!mapping.game.active) {
        console.log(`  Reason: mapped game "${mapping.game.nameEn}" (${mapping.game.code}) is set INACTIVE in Admin -> Game API.`);
      } else if (!it.inputs || !(it.inputs.playerId || it.inputs["player-id"])) {
        console.log("  Reason: mapping looks fine and active, but no Player ID was captured in this order's inputs — check the field key used on the product's checkout inputs (must be exactly 'playerId').");
      } else {
        console.log("  Reason: UNCLEAR — mapping exists and is active, Player ID present, but no GameApiOrder row exists. This needs deeper investigation (was gameApiEnabled off at the time? was G2BULK_API_KEY unset at the time?).");
      }
    }
  }

  await prisma.$disconnect();
})().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
