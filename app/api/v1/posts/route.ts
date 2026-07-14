import { getPosts } from "@/lib/data/content";
import { ok } from "@/lib/api/core";

export async function GET() {
  return ok({ posts: await getPosts() });
}
