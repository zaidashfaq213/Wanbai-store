import { cookies } from "next/headers";
import { currencies, type Currency } from "./catalog";

export async function getCurrency(): Promise<Currency> {
  const store = await cookies();
  const code = store.get("currency")?.value;
  return currencies.find((c) => c.code === code) ?? currencies[0];
}
