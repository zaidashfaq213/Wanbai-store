import { getGsmServiceBySlug } from "@/lib/data/gsm";
import { ok, notFound } from "@/lib/api/core";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const service = await getGsmServiceBySlug(slug);
  if (!service) return notFound();
  return ok({ service });
}
