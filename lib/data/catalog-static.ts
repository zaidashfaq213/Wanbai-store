// Static seed data for the catalog. This is ONLY used by prisma/seed.ts to
// populate the database the first time. At runtime the app reads the catalog
// from the DB (see lib/data/catalog-db.ts) so admins can manage it.
import type { Category, Product } from "./catalog";

export const STATIC_CATEGORIES: Category[] = [
  { slug: "game-fill", name: { ar: "شحن الألعاب", en: "Game Top-Up" }, icon: "🎮", gradient: "from-violet-500 to-fuchsia-500" },
  { slug: "game-cards", name: { ar: "بطاقات الألعاب", en: "Game Cards" }, icon: "🃏", gradient: "from-sky-500 to-cyan-400" },
  { slug: "e-payment", name: { ar: "الدفع الإلكتروني", en: "E-Payment" }, icon: "💳", gradient: "from-emerald-500 to-teal-400" },
  { slug: "social-media", name: { ar: "سوشيال ميديا", en: "Social Media" }, icon: "📱", gradient: "from-pink-500 to-rose-400" },
  { slug: "activation-keys", name: { ar: "مفاتيح التفعيل", en: "Activation Keys" }, icon: "🔑", gradient: "from-amber-500 to-orange-400" },
  { slug: "shopping", name: { ar: "التسوق", en: "Shopping" }, icon: "🛍️", gradient: "from-indigo-500 to-blue-400" },
  { slug: "telecom", name: { ar: "بطاقات الاتصالات", en: "Telecom Cards" }, icon: "📶", gradient: "from-lime-500 to-green-400" },
  { slug: "app-subscriptions", name: { ar: "اشتراكات التطبيقات", en: "App Subscriptions" }, icon: "📺", gradient: "from-red-500 to-fuchsia-500" },
];

function p(
  slug: string, ar: string, en: string, category: string, initial: string,
  hue: number, priceFrom: number, rating: number, reviews: number,
  badgeAr = "تسليم فوري", badgeEn = "Instant",
): Product {
  return { slug, name: { ar, en }, category, initial, hue, priceFrom, rating, reviews, badge: { ar: badgeAr, en: badgeEn } };
}

export const STATIC_PRODUCTS: Product[] = [
  // Game Top-Up
  p("free-fire", "فري فاير", "Free Fire", "game-fill", "FF", 280, 1.0, 5.0, 52),
  p("pubg-mobile", "ببجي موبايل", "PUBG Mobile", "game-fill", "PU", 265, 1.5, 4.9, 41),
  p("efootball", "اي فوتبول", "eFootball", "game-fill", "EF", 150, 0.99, 4.8, 18),
  p("call-of-duty", "كول أوف ديوتي", "Call of Duty", "game-fill", "COD", 20, 1.2, 4.9, 27),
  p("mobile-legends", "موبايل ليجندز", "Mobile Legends", "game-fill", "ML", 200, 0.8, 4.7, 22),
  p("genshin-impact", "جينشن امباكت", "Genshin Impact", "game-fill", "GI", 45, 0.99, 4.9, 33),
  p("clash-of-clans", "كلاش أوف كلانس", "Clash of Clans", "game-fill", "COC", 32, 0.99, 4.8, 24),
  p("blood-strike", "بلود سترايك", "Blood Strike", "game-fill", "BS", 0, 0.99, 4.7, 13),
  p("brawl-stars", "براول ستارز", "Brawl Stars", "game-fill", "BR", 45, 0.99, 4.8, 19),
  p("8-ball-pool", "8 بول بول", "8 Ball Pool", "game-fill", "8", 140, 0.99, 4.7, 16),
  p("pubg-new-state", "ببجي نيو ستيت", "PUBG New State", "game-fill", "NS", 40, 1.5, 4.6, 9),
  p("jawaker", "جواكر", "Jawaker", "game-fill", "JW", 0, 1.0, 4.7, 12),
  // Game Cards
  p("steam", "ستيم", "Steam", "game-cards", "S", 210, 5.0, 5.0, 64, "بطاقة رقمية", "Gift card"),
  p("roblox", "روبلوكس", "Roblox", "game-cards", "R", 0, 4.5, 4.9, 38, "بطاقة رقمية", "Gift card"),
  p("playstation", "بلايستيشن", "PlayStation", "game-cards", "PS", 220, 10.0, 5.0, 51, "بطاقة رقمية", "Gift card"),
  p("xbox", "اكس بوكس", "Xbox", "game-cards", "X", 130, 10.0, 4.8, 29, "بطاقة رقمية", "Gift card"),
  p("razer-gold", "رايزر جولد", "Razer Gold", "game-cards", "RG", 50, 5.0, 4.9, 24, "بطاقة رقمية", "Gift card"),
  p("yalla-ludo", "يلا لودو", "Yalla Ludo", "game-cards", "YL", 25, 0.99, 4.7, 15, "بطاقة رقمية", "Gift card"),
  // E-Payment
  p("bill-payment", "دفع الفواتير", "Bill Payment", "e-payment", "BP", 160, 1.0, 4.8, 12),
  p("starlink", "ستارلينك", "Starlink", "e-payment", "SL", 200, 50.0, 4.9, 8),
  p("tiktok-coins", "عملات تيك توك", "TikTok Coins", "e-payment", "TT", 330, 1.29, 4.8, 19),
  // Social Media
  p("x-twitter", "اكس / تويتر", "X / Twitter", "social-media", "X", 205, 2.0, 4.6, 11, "خدمة", "Service"),
  p("facebook", "فيسبوك", "Facebook", "social-media", "F", 215, 2.0, 4.8, 23, "خدمة", "Service"),
  p("snapchat", "سناب شات", "Snapchat", "social-media", "SC", 55, 2.0, 4.7, 14, "خدمة", "Service"),
  p("instagram", "انستغرام", "Instagram", "social-media", "IG", 320, 2.5, 4.8, 26, "خدمة", "Service"),
  p("youtube", "يوتيوب", "YouTube", "social-media", "YT", 0, 3.0, 4.7, 17, "خدمة", "Service"),
  // Activation Keys
  p("office-365", "اوفيس 365", "Office 365", "activation-keys", "O", 25, 12.0, 5.0, 21, "مفتاح", "Key"),
  p("windows-11", "ويندوز 11", "Windows 11", "activation-keys", "W11", 210, 15.0, 4.9, 30, "مفتاح", "Key"),
  p("windows-10", "ويندوز 10", "Windows 10", "activation-keys", "W10", 200, 12.0, 4.8, 18, "مفتاح", "Key"),
  // Shopping
  p("itunes", "آيتونز", "iTunes", "shopping", "iT", 0, 5.0, 5.0, 44, "بطاقة رقمية", "Gift card"),
  p("amazon", "أمازون", "Amazon", "shopping", "A", 30, 10.0, 4.9, 37, "بطاقة رقمية", "Gift card"),
  p("noon", "نون", "Noon", "shopping", "N", 45, 10.0, 4.8, 16, "بطاقة رقمية", "Gift card"),
  p("nintendo", "نينتندو", "Nintendo Shop", "shopping", "NS", 350, 10.0, 4.9, 12, "بطاقة رقمية", "Gift card"),
  // Telecom
  p("vodafone", "فودافون", "Vodafone", "telecom", "V", 350, 1.0, 4.7, 22, "شحن", "Recharge"),
  p("orange", "اورنج", "Orange", "telecom", "O", 30, 1.0, 4.7, 19, "شحن", "Recharge"),
  p("zain", "زين", "Zain", "telecom", "Z", 270, 1.0, 4.8, 14, "شحن", "Recharge"),
  p("etisalat", "اتصالات", "Etisalat", "telecom", "E", 130, 1.0, 4.6, 11, "شحن", "Recharge"),
  // App Subscriptions
  p("netflix", "نتفليكس", "Netflix", "app-subscriptions", "N", 358, 8.0, 5.0, 49, "اشتراك", "Subscription"),
  p("spotify", "سبوتيفاي", "Spotify", "app-subscriptions", "Sp", 140, 5.0, 4.9, 35, "اشتراك", "Subscription"),
  p("shahid-vip", "شاهد VIP", "Shahid VIP", "app-subscriptions", "Sh", 280, 6.0, 4.8, 23, "اشتراك", "Subscription"),
  p("nordvpn", "نورد VPN", "NordVPN", "app-subscriptions", "NV", 210, 4.0, 4.9, 18, "اشتراك", "Subscription"),
];
