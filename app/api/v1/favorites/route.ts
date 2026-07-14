import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAllProducts } from "@/lib/data/catalog-db";
import { ok, fail, withAuth } from "@/lib/api/core";

export const GET = withAuth(async (_req, user) => {
  const [favorites, products] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    getAllProducts(),
  ]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = favorites
    .map((f) => bySlug.get(f.productSlug))
    .filter(Boolean);
  return ok({ favorites: items, slugs: favorites.map((f) => f.productSlug) });
});

const toggleSchema = z.object({ productSlug: z.string().min(1) });

// POST — toggles the product in the wishlist, returns the new state.
export const POST = withAuth(async (req, user) => {
  const parsed = toggleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");
  const { productSlug } = parsed.data;

  const existing = await prisma.favorite.findUnique({
    where: { userId_productSlug: { userId: user.id, productSlug } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return ok({ favorited: false });
  }
  await prisma.favorite.create({ data: { userId: user.id, productSlug } });
  return ok({ favorited: true });
});
