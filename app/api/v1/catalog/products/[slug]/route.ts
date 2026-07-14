import {
  getProductBySlug,
  getProductDetail,
  getProductId,
  getRelatedProducts,
} from "@/lib/data/catalog-db";
import { ok, notFound } from "@/lib/api/core";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();

  const [detail, id, related] = await Promise.all([
    getProductDetail(slug),
    getProductId(slug),
    getRelatedProducts(product),
  ]);
  if (!detail) return notFound();

  return ok({ product: { ...product, id }, detail, related });
}
