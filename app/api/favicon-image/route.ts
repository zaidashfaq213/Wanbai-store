import { getSettings } from "@/lib/data/content";

// Same reasoning as app/logo/route.ts: serve the admin-uploaded favicon as a
// real, cacheable response instead of a base64 data URL inlined in the
// <head> of every single page.
export async function GET() {
  const settings = await getSettings();
  const match = settings.favicon?.match(/^data:([^;]+);base64,(.+)$/);
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
