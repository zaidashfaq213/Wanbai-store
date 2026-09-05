// Optional demo seed — creates a test account you can log in with.
// Run after migrating:  npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STATIC_CATEGORIES, STATIC_PRODUCTS } from "../lib/data/catalog-static.ts";
import { buildDetail, FULFILLMENT } from "../lib/data/catalog-generate.ts";

const prisma = new PrismaClient();

const cents = (usd: number) => Math.round(usd * 100);
const FULFILL_ENUM = { topup: "TOPUP", code: "CODE", service: "SERVICE" } as const;

async function seedCatalog() {
  // Categories
  const categoryIdBySlug = new Map<string, string>();
  for (let i = 0; i < STATIC_CATEGORIES.length; i++) {
    const c = STATIC_CATEGORIES[i];
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        nameEn: c.name.en,
        nameAr: c.name.ar,
        icon: c.icon,
        gradient: c.gradient,
        sortOrder: i,
      },
    });
    categoryIdBySlug.set(c.slug, row.id);
  }

  // Products + their materialised detail (variant groups, packages, inputs, faqs, reviews)
  for (let i = 0; i < STATIC_PRODUCTS.length; i++) {
    const p = STATIC_PRODUCTS[i];
    const categoryId = categoryIdBySlug.get(p.category);
    if (!categoryId) continue;
    const detail = buildDetail(p);

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue; // don't overwrite admin edits on re-seed

    await prisma.product.create({
      data: {
        slug: p.slug,
        categoryId,
        nameEn: p.name.en,
        nameAr: p.name.ar,
        badgeEn: p.badge.en,
        badgeAr: p.badge.ar,
        initial: p.initial,
        hue: p.hue,
        priceFrom: cents(p.priceFrom),
        rating: p.rating,
        reviewCount: p.reviews,
        image: p.image ?? null,
        fulfillment: FULFILL_ENUM[FULFILLMENT[p.category] ?? "code"],
        overviewEn: detail.overview.en,
        overviewAr: detail.overview.ar,
        howToUseEn: detail.howToUse.en,
        howToUseAr: detail.howToUse.ar,
        ratingBreakdown: detail.ratingBreakdown,
        sortOrder: i,
        variantGroups: {
          create: detail.variantGroups.map((g, gi) => ({
            nameEn: g.name.en,
            nameAr: g.name.ar,
            sortOrder: gi,
            packages: {
              create: g.packages.map((pk, pi) => ({
                labelEn: pk.label.en,
                labelAr: pk.label.ar,
                sublabelEn: pk.sublabel?.en ?? null,
                sublabelAr: pk.sublabel?.ar ?? null,
                price: cents(pk.price),
                popular: pk.popular ?? false,
                sortOrder: pi,
              })),
            },
          })),
        },
        inputs: {
          create: detail.inputs.map((inp, ii) => ({
            key: inp.id,
            labelEn: inp.label.en,
            labelAr: inp.label.ar,
            placeholderEn: inp.placeholder.en,
            placeholderAr: inp.placeholder.ar,
            kind: inp.kind,
            required: inp.required ?? false,
            sortOrder: ii,
          })),
        },
        faqs: {
          create: detail.faqs.map((f, fi) => ({
            qEn: f.q.en,
            qAr: f.q.ar,
            aEn: f.a.en,
            aAr: f.a.ar,
            sortOrder: fi,
          })),
        },
        reviews: {
          create: detail.reviews.map((r, ri) => ({
            name: r.name,
            rating: r.rating,
            commentEn: r.comment.en,
            commentAr: r.comment.ar,
            date: r.date,
            sortOrder: ri,
          })),
        },
      },
    });
  }
  console.log(
    `Seeded ${STATIC_CATEGORIES.length} categories and ${STATIC_PRODUCTS.length} products`,
  );
}

async function seedGsm() {
  const categories = [
    {
      slug: "network-unlock",
      nameEn: "Network Unlock",
      nameAr: "فتح الشبكة",
      icon: "🔓",
      sortOrder: 0,
      services: [
        {
          slug: "carrier-unlock",
          nameEn: "Carrier Network Unlock",
          nameAr: "فتح شبكة الناقل",
          priceUsd: 15,
          descriptionEn: "Permanently unlock your phone from its current carrier so it accepts any SIM card.",
          descriptionAr: "فتح هاتفك بشكل دائم من شبكة الناقل الحالية ليقبل أي شريحة اتصال.",
          requirementsEn: "IMEI number, device brand and model.",
          requirementsAr: "رقم IMEI، نوع الجهاز والموديل.",
          processingTimeEn: "1-3 business days",
          processingTimeAr: "1-3 أيام عمل",
          fields: [
            { key: "imei", labelEn: "IMEI number", labelAr: "رقم IMEI", placeholderEn: "15-digit IMEI", placeholderAr: "رقم IMEI المكوّن من 15 رقماً", kind: "text", required: true },
            { key: "device", labelEn: "Device brand & model", labelAr: "نوع الجهاز والموديل", placeholderEn: "e.g. iPhone 13 Pro", placeholderAr: "مثال: آيفون 13 برو", kind: "text", required: true },
          ],
        },
      ],
    },
    {
      slug: "imei-services",
      nameEn: "IMEI Services",
      nameAr: "خدمات IMEI",
      icon: "🔢",
      sortOrder: 1,
      services: [
        {
          slug: "imei-check",
          nameEn: "IMEI Blacklist Check",
          nameAr: "فحص الحظر عبر IMEI",
          priceUsd: 3,
          descriptionEn: "Check whether a device's IMEI is blacklisted, reported lost/stolen, or carrier-locked.",
          descriptionAr: "تحقّق ما إذا كان رقم IMEI الخاص بجهاز محظوراً أو مُبلَّغاً عنه كمفقود/مسروق أو مقفلاً بشبكة.",
          requirementsEn: "IMEI number.",
          requirementsAr: "رقم IMEI.",
          processingTimeEn: "A few hours",
          processingTimeAr: "بضع ساعات",
          fields: [
            { key: "imei", labelEn: "IMEI number", labelAr: "رقم IMEI", placeholderEn: "15-digit IMEI", placeholderAr: "رقم IMEI المكوّن من 15 رقماً", kind: "text", required: true },
          ],
        },
      ],
    },
    {
      slug: "frp-removal",
      nameEn: "FRP Removal",
      nameAr: "إزالة FRP",
      icon: "🔐",
      sortOrder: 2,
      services: [
        {
          slug: "frp-remote-removal",
          nameEn: "Remote FRP Removal",
          nameAr: "إزالة FRP عن بُعد",
          priceUsd: 12,
          descriptionEn: "Remove Google Factory Reset Protection (FRP) remotely so you can set up the device again.",
          descriptionAr: "إزالة حماية إعادة ضبط المصنع من جوجل (FRP) عن بُعد لإعادة إعداد الجهاز.",
          requirementsEn: "Device brand/model and a photo of the FRP lock screen.",
          requirementsAr: "نوع/موديل الجهاز وصورة لشاشة قفل FRP.",
          processingTimeEn: "Same day",
          processingTimeAr: "في نفس اليوم",
          fields: [
            { key: "device", labelEn: "Device brand & model", labelAr: "نوع الجهاز والموديل", placeholderEn: "e.g. Samsung A54", placeholderAr: "مثال: سامسونج A54", kind: "text", required: true },
            { key: "screenshot", labelEn: "FRP lock screen photo", labelAr: "صورة شاشة قفل FRP", placeholderEn: "", placeholderAr: "", kind: "file", required: true },
          ],
        },
      ],
    },
    {
      slug: "mobile-repair",
      nameEn: "Mobile Repair",
      nameAr: "صيانة الجوالات",
      icon: "🛠️",
      sortOrder: 3,
      services: [
        {
          slug: "screen-diagnosis",
          nameEn: "Screen & Hardware Diagnosis",
          nameAr: "فحص الشاشة والأعطال",
          priceUsd: 5,
          descriptionEn: "Remote diagnosis of a screen or hardware issue — our technician reviews photos/videos and advises next steps.",
          descriptionAr: "تشخيص عن بُعد لمشكلة الشاشة أو العتاد — يراجع فنيّنا الصور/الفيديو ويقترح الخطوة التالية.",
          requirementsEn: "Photos of the issue and a short description.",
          requirementsAr: "صور للمشكلة ووصف مختصر.",
          processingTimeEn: "Within 24 hours",
          processingTimeAr: "خلال 24 ساعة",
          fields: [
            { key: "description", labelEn: "Describe the issue", labelAr: "صف المشكلة", placeholderEn: "What's wrong with the device?", placeholderAr: "ما هي المشكلة في الجهاز؟", kind: "text", required: true },
            { key: "photo", labelEn: "Photo of the issue", labelAr: "صورة للمشكلة", placeholderEn: "", placeholderAr: "", kind: "file", required: false },
          ],
        },
      ],
    },
  ];

  for (const cat of categories) {
    const { services, ...catData } = cat;
    const catRow = await prisma.gsmCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: catData,
    });
    for (let si = 0; si < services.length; si++) {
      const svc = services[si];
      const { fields, priceUsd, ...svcData } = svc;
      const svcRow = await prisma.gsmService.upsert({
        where: { slug: svc.slug },
        update: {},
        create: { ...svcData, price: cents(priceUsd), categoryId: catRow.id, sortOrder: si },
      });
      for (let fi = 0; fi < fields.length; fi++) {
        const f = fields[fi];
        await prisma.gsmServiceField.upsert({
          where: { serviceId_key: { serviceId: svcRow.id, key: f.key } },
          update: {},
          create: { ...f, serviceId: svcRow.id, sortOrder: fi },
        });
      }
    }
  }
  console.log(`Seeded ${categories.length} GSM categories and ${categories.reduce((n, c) => n + c.services.length, 0)} services`);
}

async function main() {
  const email = "demo@wanbai.store";
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      username: "demo",
      passwordHash,
      emailVerified: new Date(),
      preferredLocale: "ar",
      preferredCurrency: "USD",
      walletBalance: 2500, // $25.00
      walletTransactions: {
        create: { amount: 2500, type: "TOPUP", description: "Welcome credit" },
      },
      notifications: {
        create: {
          type: "SYSTEM",
          title: "Welcome to WANBI STOER 🎉",
          body: "Your demo account is ready. Explore the store!",
          href: "/dashboard",
        },
      },
    },
  });

  console.log(`Seeded demo user: ${user.email} / password123`);

  // Admin account for the back-office.
  const admin = await prisma.user.upsert({
    where: { email: "admin@wanbai.store" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@wanbai.store",
      name: "Store Admin",
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 12),
      emailVerified: new Date(),
      role: "ADMIN",
      preferredLocale: "ar",
    },
  });
  console.log(`Seeded admin user: ${admin.email} / admin123`);

  // Payout banks. Account numbers are placeholders — edit them in the admin
  // panel (Bank Accounts) with your real details.
  const banks = [
    {
      key: "o-cash",
      nameEn: "O-Cash",
      nameAr: "اوو-كاش",
      accountName: "WANBI STOER",
      accountNumber: "0000 0000 0000",
      color: "#1c8a5a",
      sortOrder: 1,
    },
    {
      key: "mycashi",
      nameEn: "MyCashi",
      nameAr: "ماي كاشي",
      accountName: "WANBI STOER",
      accountNumber: "0000 0000 0000",
      color: "#5b3fd1",
      sortOrder: 2,
    },
    {
      key: "bok",
      nameEn: "Bankak (BOK)",
      nameAr: "بنكك",
      accountName: "WANBI STOER",
      accountNumber: "0000 0000 0000",
      color: "#d81f26",
      sortOrder: 3,
    },
  ];
  for (const b of banks) {
    await prisma.bankAccount.upsert({
      where: { key: b.key },
      update: {},
      create: b,
    });
  }
  console.log(`Seeded ${banks.length} bank accounts`);

  await seedCatalog();
  await seedContent();
  await seedGsm();
}

async function seedContent() {
  // --- CMS / legal pages (slugs match the footer links) ---
  const pages = [
    {
      slug: "about-us",
      titleEn: "About Us",
      titleAr: "من نحن",
      bodyEn:
        "WANBI STOER is a digital goods marketplace for game top-ups, gift cards, e-payment services, activation keys, telecom recharge and app subscriptions.\n\nEvery order is handled by our team and delivered to your email and your account. We focus on fair prices, genuine products and fast, human support.",
      bodyAr:
        "وانبي ستور هو متجر للمنتجات الرقمية: شحن الألعاب، البطاقات الرقمية، الدفع الإلكتروني، مفاتيح التفعيل، بطاقات الاتصالات واشتراكات التطبيقات.\n\nيتم تنفيذ كل طلب من قِبل فريقنا وتسليمه إلى بريدك الإلكتروني وحسابك. نركّز على الأسعار العادلة والمنتجات الأصلية والدعم السريع.",
      sortOrder: 1,
    },
    {
      slug: "terms-and-conditions",
      titleEn: "Terms of Service",
      titleAr: "شروط الخدمة",
      bodyEn:
        "By using WANBI STOER you agree to these terms.\n\n1. Accounts — you are responsible for the accuracy of the details you provide (such as a Player ID). Orders fulfilled with incorrect details cannot be reversed.\n2. Pricing — prices are shown in your selected currency and are converted from USD.\n3. Payments — payments are made by bank transfer and confirmed manually after review, or from your in-app wallet balance.\n4. Delivery — digital products are delivered by email and inside your account after payment is confirmed.\n5. Abuse — fraudulent payment proofs or chargebacks will result in account suspension.",
      bodyAr:
        "باستخدامك وانبي ستور فإنك توافق على هذه الشروط.\n\n١. الحسابات — أنت مسؤول عن صحة البيانات التي تدخلها (مثل معرّف اللاعب). الطلبات التي تُنفّذ ببيانات خاطئة لا يمكن التراجع عنها.\n٢. الأسعار — تُعرض بالعملة التي تختارها وتُحوّل من الدولار.\n٣. المدفوعات — تتم عبر التحويل البنكي وتُعتمد يدوياً بعد المراجعة، أو من رصيد محفظتك.\n٤. التسليم — تُسلَّم المنتجات الرقمية عبر البريد وداخل حسابك بعد تأكيد الدفع.\n٥. إساءة الاستخدام — تقديم إثباتات دفع مزوّرة يؤدي إلى إيقاف الحساب.",
      sortOrder: 2,
    },
    {
      slug: "privacy-policy",
      titleEn: "Privacy Policy",
      titleAr: "سياسة الخصوصية",
      bodyEn:
        "We collect only what we need to fulfil your orders: your name, email, the details required by the product (such as a Player ID), and your payment screenshots.\n\nWe never sell your data. Payment screenshots are stored securely and used solely to verify your transfer. You may request deletion of your account and data at any time by contacting support.",
      bodyAr:
        "نجمع فقط ما نحتاجه لتنفيذ طلباتك: الاسم، البريد الإلكتروني، البيانات المطلوبة للمنتج (مثل معرّف اللاعب)، وصور إثبات الدفع.\n\nلا نبيع بياناتك أبداً. تُخزَّن صور الدفع بشكل آمن وتُستخدم فقط للتحقق من تحويلك. يمكنك طلب حذف حسابك وبياناتك في أي وقت عبر التواصل مع الدعم.",
      sortOrder: 3,
    },
    {
      slug: "return-policy",
      titleEn: "Return Policy",
      titleAr: "سياسة الإرجاع",
      bodyEn:
        "Digital products cannot be returned once they have been delivered.\n\nIf an order was not delivered, was delivered incorrectly, or a code does not work, contact support within 48 hours and we will fix it or refund the amount to your wallet.\n\nOrders that are still pending (not yet fulfilled) can be cancelled and refunded to your wallet.",
      bodyAr:
        "لا يمكن إرجاع المنتجات الرقمية بعد تسليمها.\n\nإذا لم يصلك الطلب أو وصل بشكل خاطئ أو لم يعمل الكود، تواصل مع الدعم خلال 48 ساعة وسنصلح المشكلة أو نعيد المبلغ إلى محفظتك.\n\nالطلبات التي لا تزال قيد الانتظار (لم تُنفّذ بعد) يمكن إلغاؤها واسترداد قيمتها إلى المحفظة.",
      sortOrder: 4,
    },
    {
      slug: "cookie-policy",
      titleEn: "Cookie Policy",
      titleAr: "سياسة ملفات الارتباط",
      bodyEn:
        "We use a small number of cookies that are necessary for the store to work:\n\n• session — keeps you signed in.\n• theme — remembers light/dark mode.\n• currency — remembers your selected currency.\n• NEXT_LOCALE — remembers your language.\n\nWe do not use advertising or tracking cookies.",
      bodyAr:
        "نستخدم عدداً محدوداً من ملفات الارتباط الضرورية لعمل المتجر:\n\n• الجلسة — لإبقائك مسجّل الدخول.\n• المظهر — لتذكّر الوضع الفاتح/الداكن.\n• العملة — لتذكّر العملة المختارة.\n• NEXT_LOCALE — لتذكّر لغتك.\n\nلا نستخدم ملفات ارتباط إعلانية أو تتبّعية.",
      sortOrder: 5,
    },
    {
      slug: "gdpr",
      titleEn: "GDPR / Data Protection",
      titleAr: "حماية البيانات (GDPR)",
      bodyEn:
        "You have the right to access, correct, export and delete the personal data we hold about you.\n\nTo exercise any of these rights, open a support ticket or email us. We will respond within 30 days. We retain order records for accounting purposes even after account deletion, with personal identifiers removed.",
      bodyAr:
        "لك الحق في الوصول إلى بياناتك الشخصية وتصحيحها وتصديرها وحذفها.\n\nلممارسة أي من هذه الحقوق، افتح تذكرة دعم أو راسلنا عبر البريد. سنرد خلال 30 يوماً. نحتفظ بسجلات الطلبات لأغراض محاسبية حتى بعد حذف الحساب، مع إزالة البيانات الشخصية.",
      sortOrder: 6,
    },
  ];
  for (const p of pages) {
    await prisma.page.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // --- Help-centre FAQs ---
  const faqs = [
    {
      categoryKey: "getting-started",
      qEn: "How do I place an order?",
      qAr: "كيف أقوم بالطلب؟",
      aEn: "Open a product, choose a package, sign in, then pay from your wallet or by bank transfer. After payment is confirmed we deliver to your email and account.",
      aAr: "افتح المنتج، اختر الباقة، سجّل الدخول، ثم ادفع من محفظتك أو عبر التحويل البنكي. بعد تأكيد الدفع نسلّم الطلب إلى بريدك وحسابك.",
      sortOrder: 1,
    },
    {
      categoryKey: "getting-started",
      qEn: "How long does delivery take?",
      qAr: "كم يستغرق التسليم؟",
      aEn: "Wallet payments are processed right away. Bank transfers are reviewed by our team, usually within a few minutes during working hours.",
      aAr: "المدفوعات من المحفظة تُعالج فوراً. التحويلات البنكية يراجعها فريقنا، عادةً خلال دقائق في ساعات العمل.",
      sortOrder: 2,
    },
    {
      categoryKey: "account",
      qEn: "How do I top up my wallet?",
      qAr: "كيف أشحن محفظتي؟",
      aEn: "Go to Dashboard → Wallet, choose an amount and a bank, transfer the money, then upload the payment screenshot. Once approved, your balance is credited.",
      aAr: "اذهب إلى لوحة التحكم ← المحفظة، اختر المبلغ والبنك، حوّل المبلغ، ثم ارفع صورة إثبات الدفع. بعد الموافقة يُضاف الرصيد.",
      sortOrder: 1,
    },
    {
      categoryKey: "account",
      qEn: "I didn't get my verification code",
      qAr: "لم يصلني رمز التحقق",
      aEn: "Check your spam folder. You can request a new 6-digit code from the verification page at any time.",
      aAr: "تحقق من مجلد الرسائل غير المرغوبة. يمكنك طلب رمز جديد من 6 أرقام من صفحة التحقق في أي وقت.",
      sortOrder: 2,
    },
    {
      categoryKey: "orders",
      qEn: "My payment is still under review",
      qAr: "دفعتي لا تزال قيد المراجعة",
      aEn: "Bank transfers are verified manually. If it has been longer than a few hours, open a support ticket with your order reference.",
      aAr: "تُراجَع التحويلات البنكية يدوياً. إذا مضت عدة ساعات، افتح تذكرة دعم مع رقم طلبك.",
      sortOrder: 1,
    },
    {
      categoryKey: "orders",
      qEn: "The code I received doesn't work",
      qAr: "الكود الذي استلمته لا يعمل",
      aEn: "Open a support ticket within 48 hours with your order reference and a screenshot of the error. We'll replace it or refund your wallet.",
      aAr: "افتح تذكرة دعم خلال 48 ساعة مع رقم الطلب وصورة للخطأ. سنستبدله أو نعيد المبلغ إلى محفظتك.",
      sortOrder: 2,
    },
  ];
  if ((await prisma.helpFaq.count()) === 0) {
    await prisma.helpFaq.createMany({ data: faqs });
  }

  // --- Blog ---
  const posts = [
    {
      slug: "how-to-top-up-free-fire",
      titleEn: "How to top up Free Fire safely",
      titleAr: "كيف تشحن فري فاير بأمان",
      excerptEn: "A step-by-step guide to topping up Free Fire diamonds without getting scammed.",
      excerptAr: "دليل خطوة بخطوة لشحن جواهر فري فاير دون التعرّض للاحتيال.",
      bodyEn:
        "Topping up Free Fire is simple when you use a trusted store.\n\n1. Find your Player ID inside the game profile.\n2. Choose the gems package you want.\n3. Pay from your wallet or by bank transfer.\n4. We process the top-up and confirm by email.\n\nNever share your account password with anyone — a legitimate top-up only needs your Player ID.",
      bodyAr:
        "شحن فري فاير سهل عندما تستخدم متجراً موثوقاً.\n\n١. اعثر على معرّف اللاعب داخل ملفك في اللعبة.\n٢. اختر باقة الجواهر المناسبة.\n٣. ادفع من محفظتك أو عبر التحويل البنكي.\n٤. ننفّذ الشحن ونؤكّد عبر البريد.\n\nلا تشارك كلمة مرور حسابك مع أحد — الشحن الصحيح يحتاج معرّف اللاعب فقط.",
    },
    {
      slug: "wallet-vs-bank-transfer",
      titleEn: "Wallet or bank transfer — which should you use?",
      titleAr: "المحفظة أم التحويل البنكي — أيهما تختار؟",
      excerptEn: "Both work. Here's when each one makes sense.",
      excerptAr: "كلاهما يعمل. إليك متى يناسبك كل خيار.",
      bodyEn:
        "If you buy often, top up your wallet once and then every purchase is instant — no screenshot needed each time.\n\nIf you buy occasionally, paying by bank transfer per order is perfectly fine. You'll upload a screenshot and we'll confirm it.",
      bodyAr:
        "إذا كنت تشتري كثيراً، اشحن محفظتك مرة واحدة وستصبح كل عملية شراء فورية — دون الحاجة لرفع صورة في كل مرة.\n\nإذا كنت تشتري أحياناً، فالدفع بالتحويل البنكي لكل طلب مناسب تماماً. سترفع صورة الإثبات وسنؤكّدها.",
    },
  ];
  for (const p of posts) {
    await prisma.post.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // --- Store settings ---
  await prisma.storeSettings.upsert({
    where: { id: "store" },
    update: {},
    create: {
      id: "store",
      whatsapp: "",
      telegram: "",
      supportEmail: "support@wanbai.store",
    },
  });

  console.log(
    `Seeded ${pages.length} pages, ${faqs.length} FAQs, ${posts.length} blog posts, settings`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
