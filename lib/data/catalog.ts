import type { Locale } from "@/lib/i18n/config";

// Shared catalog types + a few small static datasets (currencies, testimonials,
// partners). The product catalog itself lives in the database and is read via
// lib/data/catalog-db.ts. This module must stay free of server-only imports so
// client components can safely import its types and the currency list.

export type Localized = Record<Locale, string>;

export type Category = {
  slug: string;
  name: Localized;
  icon: string; // emoji used as a lightweight placeholder icon
  gradient: string; // tailwind gradient classes for the tile
};

export type Product = {
  slug: string;
  name: Localized;
  category: string; // category slug
  badge: Localized;
  initial: string; // shown on the gradient art placeholder
  hue: number; // base hue for the generated art
  priceFrom: number; // base price in USD
  rating: number;
  reviews: number;
  image?: string;
};

export type Testimonial = {
  id: string;
  quote: Localized;
  name: Localized;
  initial: string;
  hue: number;
};

export const testimonials: Testimonial[] = [
  { id: "t1", initial: "م", hue: 280, name: { ar: "محمد العتيبي", en: "Mohammed Al-Otaibi" }, quote: { ar: "أسرع متجر جربته، وصلني الشحن خلال ثوانٍ على البريد. تجربة ممتازة!", en: "The fastest store I've tried — my top-up arrived by email within seconds. Excellent experience!" } },
  { id: "t2", initial: "س", hue: 320, name: { ar: "سارة الأحمد", en: "Sara Al-Ahmad" }, quote: { ar: "أسعار منافسة ودعم فعّال يرد بسرعة. صرت أشتري كل بطاقاتي من هنا.", en: "Competitive prices and responsive support. I now buy all my cards here." } },
  { id: "t3", initial: "ع", hue: 200, name: { ar: "عبدالله القحطاني", en: "Abdullah Al-Qahtani" }, quote: { ar: "واجهة سهلة وآمنة، والدفع تم بدون أي مشاكل. أنصح به بشدة.", en: "Clean, secure interface and payment went through with no issues. Highly recommended." } },
  { id: "t4", initial: "ل", hue: 160, name: { ar: "ليان الدوسري", en: "Layan Al-Dosari" }, quote: { ar: "اشتركت في نتفليكس ووصلني الكود فوراً. خدمة احترافية بكل معنى الكلمة.", en: "Subscribed to Netflix and got the code instantly. A truly professional service." } },
];

export type Partner = { name: string; slug: string };

export const partners: Partner[] = [
  { name: "Garena", slug: "garena" },
  { name: "PUBG", slug: "pubg" },
  { name: "Supercell", slug: "supercell" },
  { name: "Steam", slug: "steam" },
  { name: "Roblox", slug: "roblox" },
  { name: "Xbox", slug: "xbox" },
  { name: "PlayStation", slug: "playstation" },
  { name: "iTunes", slug: "itunes" },
  { name: "Netflix", slug: "netflix" },
  { name: "Spotify", slug: "spotify" },
  { name: "Razer", slug: "razer" },
  { name: "Konami", slug: "konami" },
  { name: "Nintendo", slug: "nintendo" },
];

export type Currency = {
  code: string;
  symbol: string;
  flag: string;
  rate: number; // multiplier from base USD
};

export const currencies: Currency[] = [
  { code: "USD", symbol: "$", flag: "🇺🇸", rate: 1 },
  { code: "EGP", symbol: "ج.م", flag: "🇪🇬", rate: 48.5 },
  { code: "SDG", symbol: "ج.س", flag: "🇸🇩", rate: 600 },
];

export const partnerCount = 13;
