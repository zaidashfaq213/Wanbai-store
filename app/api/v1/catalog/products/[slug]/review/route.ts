import { z } from "zod";
import { prisma } from "@/lib/db";
import { getProductId } from "@/lib/data/catalog-db";
import { hasPurchased, hasReviewed } from "@/lib/data/content";
import { ok, fail, notFound, getApiUser, unauthorized } from "@/lib/api/core";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(600),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const { slug } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");

  const productId = await getProductId(slug);
  if (!productId) return notFound();

  if (!(await hasPurchased(user.id, slug))) return fail("not_purchased", 403);
  if (await hasReviewed(user.id, productId)) return fail("already_reviewed", 409);

  const { rating, comment } = parsed.data;
  await prisma.productReview.create({
    data: {
      productId,
      userId: user.id,
      name: user.name ?? "Customer",
      rating,
      commentEn: comment,
      commentAr: comment,
      date: new Date().toISOString().slice(0, 10),
    },
  });

  // Keep the product's headline rating in sync.
  const agg = await prisma.productReview.aggregate({
    where: { productId, approved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((agg._avg.rating ?? 5) * 10) / 10,
      reviewCount: typeof agg._count === "number" ? agg._count : 0,
    },
  });

  return ok({ status: "review_saved" }, 201);
}
