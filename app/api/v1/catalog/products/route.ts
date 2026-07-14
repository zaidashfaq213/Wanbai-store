import {
  getAllProducts,
  getProductsByCategory,
  searchProducts,
} from "@/lib/data/catalog-db";
import { ok } from "@/lib/api/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q");
  const limit = Number(url.searchParams.get("limit") ?? 0) || undefined;

  const products = q
    ? await searchProducts(q)
    : category
      ? await getProductsByCategory(category, limit)
      : await getAllProducts();

  return ok({ products });
}
