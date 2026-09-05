import { getGsmCategories } from "@/lib/data/gsm";
import { ok } from "@/lib/api/core";

export async function GET() {
  return ok({ categories: await getGsmCategories() });
}
