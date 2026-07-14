import { getHelpFaqs } from "@/lib/data/content";
import { ok } from "@/lib/api/core";

export async function GET() {
  return ok({ faqs: await getHelpFaqs() });
}
