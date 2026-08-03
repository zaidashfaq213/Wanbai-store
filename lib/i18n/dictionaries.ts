import "server-only";
import { cache } from "react";
import type { Locale } from "./config";

const dictionaries = {
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["ar"]>>;

// Every layout + page in a request tree calls this with the same locale —
// cache() collapses those into a single dynamic import per request instead of
// re-importing/re-resolving the dictionary module on every call site.
export const getDictionary = cache(
  async (locale: Locale): Promise<Dictionary> => dictionaries[locale](),
);
