import { getSettings } from "@/lib/data/content";

// Serves the admin-uploaded logo as a real, cacheable image response instead
// of embedding the base64 data URL inline in every page's HTML. The logo
// renders 2-3 times per page (header desktop/mobile + footer) — inlining it
// meant the same ~300KB+ blob shipped multiple times in every single page
// load, uncacheable across navigations. This route lets the browser fetch it
// once and reuse it everywhere, which matters a lot on slow connections.
export async function GET() {
  const settings = await getSettings();
  const match = settings.logo?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return new Response(null, { status: 404 });

  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": mime,
      // Short enough that an admin's logo change shows up promptly, long
      // enough to avoid re-fetching it on every page during a single visit.
      "Cache-Control": "public, max-age=300",
    },
  });
}
