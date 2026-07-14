import { currencies } from "@/lib/data/catalog";
import { ok } from "@/lib/api/core";

export async function GET() {
  return ok({ currencies });
}
