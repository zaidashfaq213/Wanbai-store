import { getProductBySlug } from "@/lib/data/catalog-db";

// Same reasoning as /api/logo and /api/favicon-image: serve an
// admin-uploaded product image as a real, cacheable response instead of a
// base64 data URL embedded directly in the page (which Next.js's RSC
// serialization ends up shipping twice per page — once rendered, once in
// the hydration payload).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const match = product?.image?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return new Response(null, { status: 404 });

  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=300",
    },
  });
}
