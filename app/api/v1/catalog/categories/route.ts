import { getCategories } from "@/lib/data/catalog-db";
import { ok } from "@/lib/api/core";

export async function GET() {
  return ok({ categories: await getCategories() });
}
