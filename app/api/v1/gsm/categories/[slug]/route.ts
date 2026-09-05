import { getGsmCategoryBySlug } from "@/lib/data/gsm";
import { ok, notFound } from "@/lib/api/core";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const category = await getGsmCategoryBySlug(slug);
  if (!category) return notFound();
  return ok({ category });
}
