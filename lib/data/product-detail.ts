import type { Localized } from "./catalog";

// Product-detail types. The data itself is stored in the DB and read via
// lib/data/catalog-db.ts (getProductDetail). Kept here so client components
// (e.g. the purchase panel) can import the types without pulling in the DB.

export type Package = {
  id: string;
  label: Localized;
  sublabel?: Localized;
  price: number; // base USD
  // Set only when the admin has enabled the strikethrough sale display for
  // this package — never present otherwise, so callers can just check
  // truthiness rather than also checking a separate "enabled" flag.
  compareAtPrice?: number; // base USD
  popular?: boolean;
};
export type VariantGroup = { id: string; name: Localized; packages: Package[] };
export type InputField = {
  id: string;
  label: Localized;
  placeholder: Localized;
  kind: "text" | "number" | "select";
  options?: Localized[];
  required?: boolean;
};
export type Faq = { q: Localized; a: Localized };
export type Review = { name: string; rating: number; comment: Localized; date: string };
export type Fulfillment = "topup" | "code" | "service";

export type ProductDetail = {
  fulfillment: Fulfillment;
  variantGroups: VariantGroup[];
  inputs: InputField[];
  overview: Localized;
  howToUse: Localized;
  faqs: Faq[];
  reviews: Review[];
  ratingBreakdown: [number, number, number, number, number]; // 5★ → 1★
};
