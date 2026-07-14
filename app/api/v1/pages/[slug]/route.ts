import { getPage } from "@/lib/data/content";
import { ok, notFound } from "@/lib/api/core";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return notFound();
  return ok({ page });
}
