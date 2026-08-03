import { cache } from "react";
import { cookies } from "next/headers";
import { currencies, type Currency } from "./catalog";

// Called from nearly every layout + page in a request tree — cache() collapses
// those into a single cookies() read per request.
export const getCurrency = cache(async (): Promise<Currency> => {
  const store = await cookies();
  const code = store.get("currency")?.value;
  return currencies.find((c) => c.code === code) ?? currencies[0];
});
