import { getSettings } from "@/lib/data/content";
import { ok } from "@/lib/api/core";

export async function GET() {
  const s = await getSettings();
  return ok({
    settings: {
      whatsapp: s.whatsapp,
      telegram: s.telegram,
      supportEmail: s.supportEmail,
      facebook: s.facebook,
      instagram: s.instagram,
      youtube: s.youtube,
      tiktok: s.tiktok,
    },
  });
}
