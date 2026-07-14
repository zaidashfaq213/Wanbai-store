import { getPost } from "@/lib/data/content";
import { ok, notFound } from "@/lib/api/core";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();
  return ok({ post });
}
