// Pure generators that materialise a full ProductDetail (variant groups,
// packages, inputs, FAQs, reviews, copy) from a minimal product definition.
// Used to seed the DB and to give admin-created products sensible defaults —
// which the admin can then edit. No DB access here.
import type { Localized, Product } from "./catalog";
import type {
  Package,
  VariantGroup,
  InputField,
  Faq,
  Review,
  Fulfillment,
  ProductDetail,
} from "./product-detail";

const L = (ar: string, en: string): Localized => ({ ar, en });
const r2 = (n: number) => Math.round(n * 100) / 100;

export const FULFILLMENT: Record<string, Fulfillment> = {
  "game-fill": "topup",
  telecom: "topup",
  "e-payment": "topup",
  "social-media": "service",
  "game-cards": "code",
  shopping: "code",
  "activation-keys": "code",
  "app-subscriptions": "code",
};

const GAME_UNITS: Record<string, Localized> = {
  "free-fire": L("جوهرة", "Gems"),
  "pubg-mobile": L("شدة UC", "UC"),
  "pubg-new-state": L("NC", "NC"),
  "call-of-duty": L("CP", "CP"),
  "mobile-legends": L("ماسة", "Diamonds"),
  "genshin-impact": L("بلورة", "Crystals"),
  "clash-of-clans": L("جوهرة", "Gems"),
  "brawl-stars": L("جوهرة", "Gems"),
  "blood-strike": L("ذهب", "Gold"),
  "8-ball-pool": L("عملة", "Coins"),
  efootball: L("عملة", "Coins"),
  jawaker: L("توكنز", "Tokens"),
};

const GAME_TIERS = [
  { units: 110, mult: 1 },
  { units: 231, mult: 2 },
  { units: 583, mult: 5, popular: true },
  { units: 1188, mult: 10 },
  { units: 2420, mult: 20 },
  { units: 6138, mult: 50 },
];

function topupPackages(product: Product): Package[] {
  const unit = GAME_UNITS[product.slug] ?? L("وحدة", "Units");
  return GAME_TIERS.map((t, i) => ({
    id: `pkg-${i}`,
    label: L(`${t.units} ${unit.ar}`, `${t.units} ${unit.en}`),
    price: r2(product.priceFrom * t.mult),
    popular: t.popular,
  }));
}

function valueCardPackages(values: number[], popularIndex = 2): Package[] {
  return values.map((v, i) => ({
    id: `pkg-${i}`,
    label: L(`بطاقة ${v}$`, `$${v} Card`),
    price: v,
    popular: i === popularIndex,
  }));
}

function rechargePackages(values: number[]): Package[] {
  return values.map((v, i) => ({
    id: `pkg-${i}`,
    label: L(`${v}$ رصيد`, `$${v} Credit`),
    price: v,
    popular: i === 1,
  }));
}

const SUB_TIERS = [
  { months: 1, mult: 1 },
  { months: 3, mult: 2.7, popular: true },
  { months: 6, mult: 5 },
  { months: 12, mult: 9 },
];
function subscriptionPackages(product: Product): Package[] {
  return SUB_TIERS.map((t, i) => ({
    id: `pkg-${i}`,
    label: L(
      t.months === 1 ? "شهر واحد" : `${t.months} أشهر`,
      t.months === 1 ? "1 Month" : `${t.months} Months`,
    ),
    price: r2(product.priceFrom * t.mult),
    popular: t.popular,
  }));
}

const SOCIAL_TIERS = [1000, 5000, 10000, 25000];
// Each social-media product offers three services — followers, likes and
// views — as separate choices, priced per 1,000.
const SOCIAL_SERVICES: { id: string; name: Localized; sublabel: Localized; mult: number }[] = [
  { id: "followers", name: L("المتابعون", "Followers"), sublabel: L("متابع", "Followers"), mult: 1 },
  { id: "likes", name: L("الإعجابات", "Likes"), sublabel: L("إعجاب", "Likes"), mult: 0.6 },
  { id: "views", name: L("المشاهدات", "Views"), sublabel: L("مشاهدة", "Views"), mult: 0.3 },
];
function serviceGroups(product: Product): VariantGroup[] {
  return SOCIAL_SERVICES.map((svc) => ({
    id: svc.id,
    name: svc.name,
    packages: SOCIAL_TIERS.map((q, i) => ({
      id: `${svc.id}-${i}`,
      // Western digits in both locales — "ar-EG" alone renders Eastern
      // Arabic numerals (١٢٣...), which we don't want.
      label: L(q.toLocaleString("ar-EG-u-nu-latn"), q.toLocaleString("en-US")),
      sublabel: svc.sublabel,
      price: r2(product.priceFrom * (q / 1000) * svc.mult),
      popular: i === 1,
    })),
  }));
}

// Reusable fields (manual-fulfilment: we sign into the account or contact the
// buyer, so some products ask for login details + a WhatsApp number).
const F_EMAIL: InputField = { id: "email", label: L("البريد الإلكتروني", "Email"), placeholder: L("أدخل بريدك الإلكتروني", "Enter your email"), kind: "text", required: true };
const F_PASSWORD: InputField = { id: "password", label: L("كلمة المرور", "Password"), placeholder: L("أدخل كلمة مرور الحساب", "Enter the account password"), kind: "text", required: true };
const F_WHATSAPP: InputField = { id: "whatsapp", label: L("رقم الواتساب", "WhatsApp number"), placeholder: L("أدخل رقم الواتساب", "Enter your WhatsApp number"), kind: "text", required: true };
const F_PLAYER_ID: InputField = { id: "playerId", label: L("معرّف اللاعب (ID)", "Player ID"), placeholder: L("أدخل معرّف اللاعب", "Enter your Player ID"), kind: "text", required: true };
const F_AREA_ID: InputField = { id: "areaId", label: L("معرّف المنطقة (Zone)", "Area / Zone ID"), placeholder: L("مثال: 1234", "e.g. 1234"), kind: "text", required: true };

// Games whose fulfilment needs account login (email + password + WhatsApp).
const ACCOUNT_LOGIN_GAMES = new Set(["efootball", "clash-of-clans"]);
// Games we fulfil by contacting the buyer (email + WhatsApp).
const CONTACT_GAMES = new Set(["brawl-stars"]);

function buildInputs(product: Product): InputField[] {
  const cat = product.category;
  if (cat === "game-fill") {
    // Mobile Legends: Player ID + Area/Zone ID.
    if (product.slug === "mobile-legends") return [F_PLAYER_ID, F_AREA_ID];
    if (product.slug === "genshin-impact")
      return [F_PLAYER_ID, { id: "server", label: L("السيرفر / الزون", "Server / Zone"), placeholder: L("مثال: America", "e.g. America"), kind: "text", required: true }];
    // eFootball, Clash of Clans → login credentials + WhatsApp.
    if (ACCOUNT_LOGIN_GAMES.has(product.slug)) return [F_EMAIL, F_PASSWORD, F_WHATSAPP];
    // Brawl Stars → email + WhatsApp.
    if (CONTACT_GAMES.has(product.slug)) return [F_EMAIL, F_WHATSAPP];
    // Default top-up game → Player ID.
    return [F_PLAYER_ID];
  }
  if (cat === "telecom") return [{ id: "phone", label: L("رقم الهاتف", "Phone number"), placeholder: L("أدخل رقم الهاتف", "Enter phone number"), kind: "text", required: true }];
  if (cat === "e-payment") return [{ id: "account", label: L("رقم الحساب", "Account number"), placeholder: L("أدخل رقم الحساب", "Enter account number"), kind: "text", required: true }];
  if (cat === "social-media") return [{ id: "profile", label: L("رابط الحساب", "Profile link"), placeholder: L("الصق رابط حسابك", "Paste your profile link"), kind: "text", required: true }];
  // App subscriptions → email + WhatsApp.
  if (cat === "app-subscriptions") return [F_EMAIL, F_WHATSAPP];
  return [];
}

/**
 * Input fields for a product, derived from its category/slug. This is the
 * single source of truth for what a buyer must enter — the storefront and the
 * mobile API both read it, so updating the rules above applies everywhere
 * (including already-seeded products) without a DB migration.
 */
export function inputsForProduct(slug: string, categorySlug: string): InputField[] {
  return buildInputs({ slug, category: categorySlug } as Product);
}

function buildVariantGroups(product: Product): VariantGroup[] {
  if (product.slug === "free-fire") {
    return [
      { id: "gems", name: L("الجواهر", "Gems"), packages: topupPackages(product) },
      {
        id: "memberships", name: L("العضويات", "Memberships"),
        packages: [
          { id: "m1", label: L("العضوية الأسبوعية", "Weekly Membership"), price: 1.5, popular: true },
          { id: "m2", label: L("العضوية الشهرية", "Monthly Membership"), price: 7.0 },
          { id: "m3", label: L("بطاقة المستوى", "Level Pass"), price: 4.0 },
        ],
      },
      {
        id: "level", name: L("ترقية المستوى", "Level Upgrade"),
        packages: [
          { id: "l1", label: L("ترقية +5 مستويات", "+5 Levels"), price: 2.0 },
          { id: "l2", label: L("ترقية +10 مستويات", "+10 Levels"), price: 3.5, popular: true },
          { id: "l3", label: L("ترقية +20 مستوى", "+20 Levels"), price: 6.0 },
        ],
      },
    ];
  }

  // Social media: separate Followers / Likes / Views service groups.
  if (product.category === "social-media") return serviceGroups(product);

  let packages: Package[];
  let name: Localized;
  switch (product.category) {
    case "game-fill": packages = topupPackages(product); name = L("اختر الباقة", "Choose package"); break;
    case "app-subscriptions": packages = subscriptionPackages(product); name = L("اختر المدة", "Choose duration"); break;
    case "telecom":
    case "e-payment": packages = rechargePackages([5, 10, 20, 50, 100]); name = L("اختر القيمة", "Choose amount"); break;
    default: packages = valueCardPackages([5, 10, 25, 50, 100]); name = L("اختر الفئة", "Choose denomination");
  }
  return [{ id: "default", name, packages }];
}

function buildOverview(product: Product): Localized {
  return L(
    `اشحن ${product.name.ar} بسرعة وأمان من وانبي ستور. اختر الباقة المناسبة، أكمل عملية الدفع، وسيصلك المنتج فوراً عبر البريد الإلكتروني وداخل حسابك. جميع المنتجات أصلية 100% ومضمونة.`,
    `Top up ${product.name.en} quickly and securely with Wanbi Stoer. Pick the package that suits you, complete checkout, and receive it instantly by email and inside your account. All products are 100% genuine and guaranteed.`,
  );
}
function buildHowToUse(fulfillment: Fulfillment): Localized {
  if (fulfillment === "topup" || fulfillment === "service") {
    return L(
      "١) اختر الباقة. ٢) أدخل البيانات المطلوبة (مثل معرّف اللاعب). ٣) أكمل الدفع. ٤) يتم تنفيذ الشحن تلقائياً ويصلك تأكيد فوري.",
      "1) Select a package. 2) Enter the required details (e.g. Player ID). 3) Complete payment. 4) The top-up is processed automatically and you get instant confirmation.",
    );
  }
  return L(
    "١) اختر الفئة. ٢) أكمل الدفع. ٣) يصلك الكود فوراً عبر البريد الإلكتروني وفي صفحة طلباتي. ٤) فعّل الكود على المنصة الرسمية.",
    "1) Choose a denomination. 2) Complete payment. 3) The code arrives instantly by email and under My Orders. 4) Redeem it on the official platform.",
  );
}

function buildFaqs(product: Product, fulfillment: Fulfillment): Faq[] {
  const faqs: Faq[] = [
    { q: L("كم يستغرق الشحن؟", "How long does delivery take?"), a: L("التسليم فوري في معظم الحالات؛ خلال ثوانٍ إلى دقائق بعد تأكيد الدفع.", "Delivery is instant in most cases — within seconds to a few minutes after payment is confirmed.") },
    { q: L("هل العملية آمنة؟", "Is it safe?"), a: L("نعم، جميع المدفوعات مشفّرة والمنتجات أصلية ومصدرها موثوق.", "Yes. All payments are encrypted and every product is genuine and sourced from trusted suppliers.") },
    { q: L("هل يمكن إلغاء الطلب بعد الدفع؟", "Can I cancel after payment?"), a: L("بسبب طبيعة المنتجات الرقمية، لا يمكن الإلغاء بعد تنفيذ الطلب. راجع سياسة الإرجاع لمزيد من التفاصيل.", "Because these are digital products, orders can't be cancelled once fulfilled. See our Return Policy for details.") },
    { q: L("ماذا أفعل إذا لم يصل المنتج؟", "What if it doesn't arrive?"), a: L("تواصل مع الدعم عبر الواتساب أو من خلال تذاكر الدعم وسنحل المشكلة فوراً.", "Contact support via WhatsApp or a support ticket and we'll resolve it right away.") },
  ];
  if (fulfillment === "topup" && product.category === "game-fill") {
    faqs.push({ q: L("أين أجد معرّف اللاعب (ID)؟", "Where do I find my Player ID?"), a: L("افتح اللعبة، ادخل إلى الملف الشخصي، وستجد معرّف اللاعب (ID) أسفل اسمك.", "Open the game, go to your profile, and your Player ID is shown under your name.") });
  }
  return faqs;
}

const REVIEW_POOL: Review[] = [
  { name: "Khalid", rating: 5, date: "2026-06-21", comment: L("سريع جداً، وصلني خلال ثانية. ممتاز!", "Super fast, arrived within a second. Excellent!") },
  { name: "Sara", rating: 5, date: "2026-06-18", comment: L("أفضل أسعار ودعم محترم، أنصح به.", "Best prices and great support. Recommended.") },
  { name: "Ahmed", rating: 4, date: "2026-06-15", comment: L("كل شيء تمام، بس الدفع أخذ وقت بسيط.", "All good, payment took a little while.") },
  { name: "Layla", rating: 5, date: "2026-06-12", comment: L("تجربة سلسة وآمنة، شكراً وانبي.", "Smooth, secure experience. Thanks Wanbi.") },
  { name: "Omar", rating: 5, date: "2026-06-08", comment: L("ثاني مرة أشتري، نفس الجودة والسرعة.", "Second time buying — same quality and speed.") },
  { name: "Noor", rating: 4, date: "2026-06-03", comment: L("منتج أصلي ووصل فوراً.", "Genuine product, delivered instantly.") },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildReviews(product: Product): { reviews: Review[]; breakdown: number[] } {
  const start = hash(product.slug) % REVIEW_POOL.length;
  const reviews: Review[] = [];
  for (let i = 0; i < Math.min(4, REVIEW_POOL.length); i++) reviews.push(REVIEW_POOL[(start + i) % REVIEW_POOL.length]);
  const total = product.reviews;
  const five = Math.round(total * 0.78);
  const four = Math.round(total * 0.15);
  const three = Math.max(0, total - five - four - 1);
  return { reviews, breakdown: [five, four, three, 1, 0] };
}

export function buildDetail(product: Product): ProductDetail {
  const fulfillment = FULFILLMENT[product.category] ?? "code";
  const { reviews, breakdown } = buildReviews(product);
  return {
    fulfillment,
    variantGroups: buildVariantGroups(product),
    inputs: buildInputs(product),
    overview: buildOverview(product),
    howToUse: buildHowToUse(fulfillment),
    faqs: buildFaqs(product, fulfillment),
    reviews,
    ratingBreakdown: breakdown as ProductDetail["ratingBreakdown"],
  };
}
