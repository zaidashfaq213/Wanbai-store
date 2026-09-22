import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BoltIcon, WalletIcon, SupportIcon, ListIcon, ArrowIcon } from "@/components/ui/icons";
import { abs } from "@/lib/seo";

// A real page in code, not CMS content — this one changes rarely enough,
// and matters enough (it's linked from the main nav), that hand-editing this
// file beats going through the database every time. Content below is
// bilingual inline rather than pulled from the dictionary, since it's long-
// form and specific to this one page.

const CONTENT = {
  ar: {
    title: "وكلاؤنا",
    intro:
      "يعمل وانبي ستور مع وكلاء وموزّعين يبيعون خدمات شحن الألعاب وبطاقات الهدايا وخدمات GSM لعملائهم الخاصين — في المحلات أو المتاجر الإلكترونية أو من خلال مجتمعهم الخاص.",
    benefitsTitle: "ماذا تحصل عليه كوكيل",
    benefits: [
      { title: "أسعار جملة", body: "أسعار أقل من أسعار المتجر العادية على كامل الكتالوج." },
      { title: "محفظة خاصة بحسابك", body: "اشحن وأكمل الطلبات فوراً، دون انتظار موافقة يدوية على الدفع." },
      { title: "دعم ذو أولوية", body: "تواصل مباشر مع فريقنا، لا طوابير دعم عامة." },
      { title: "كتالوج كامل", body: "شحن الألعاب، بطاقات الهدايا، الدفع الإلكتروني، خدمات GSM وغيرها — تحت حساب واحد." },
    ],
    whoTitle: "نبحث عن",
    who: "أصحاب المحلات، البائعين عبر الإنترنت، وأي شخص لديه قاعدة عملاء ويريد تقديم خدمات الشحن الرقمي دون الحاجة لتخزين بضاعة أو التعامل مع الموردين مباشرة.",
    applyTitle: "كيف تتقدم",
    applyBody: "تواصل معنا مع نبذة قصيرة عن نشاطك التجاري (ماذا تبيع، أين، وحجم الطلبات المتوقع) وسيقوم فريقنا بمراجعة طلبك والرد عليك.",
    cta: "تواصل معنا",
  },
  en: {
    title: "Our Agents",
    intro:
      "WANBAI STORE works with agents and resellers who sell our game top-ups, gift cards, and GSM services to their own customers — in shops, online stores, or through their own community.",
    benefitsTitle: "What you get as an agent",
    benefits: [
      { title: "Wholesale pricing", body: "Pricing below our regular storefront prices, across the full catalogue." },
      { title: "Your own wallet account", body: "Top up and fulfil orders instantly — no waiting on manual payment approval." },
      { title: "Priority support", body: "Direct line to our team, not a general support queue." },
      { title: "Full catalogue access", body: "Game top-ups, gift cards, e-payment, GSM services, and more — under one account." },
    ],
    whoTitle: "Who we're looking for",
    who: "Shop owners, online sellers, and anyone with an existing customer base who wants to offer digital top-ups and services without holding their own inventory or dealing with suppliers directly.",
    applyTitle: "How to apply",
    applyBody: "Contact us with a short note about your business — what you sell, where, and your expected order volume — and our team will review your application and get back to you.",
    cta: "Contact us",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const c = CONTENT[locale];
  return {
    title: c.title,
    description: c.intro,
    alternates: { canonical: abs(`/${locale}/pages/agents`) },
  };
}

const BENEFIT_ICONS = [BoltIcon, WalletIcon, SupportIcon, ListIcon];

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const c = CONTENT[locale];

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs items={[{ label: dict.header.home, href: `/${locale}` }, { label: c.title }]} />

      <header className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-6 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -top-16 text-[9rem] opacity-[0.06] ltr:-right-8 rtl:-left-8">
          🤝
        </div>
        <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">{c.title}</h1>
        <p className="mt-3 max-w-xl text-muted">{c.intro}</p>
        <Link
          href={`/${locale}/contact`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl brand-gradient px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02]"
        >
          {c.cta}
          <ArrowIcon className="size-4 rtl:rotate-180" />
        </Link>
      </header>

      <h2 className="mb-4 text-lg font-extrabold">{c.benefitsTitle}</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {c.benefits.map((b, i) => {
          const Icon = BENEFIT_ICONS[i];
          return (
            <div key={i} className="flex gap-3 rounded-2xl border border-border bg-surface p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-extrabold">{b.title}</h3>
                <p className="mt-0.5 text-sm text-muted">{b.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-extrabold">{c.whoTitle}</h2>
          <p className="mt-2 text-sm text-muted">{c.who}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-extrabold">{c.applyTitle}</h2>
          <p className="mt-2 text-sm text-muted">{c.applyBody}</p>
          <Link
            href={`/${locale}/contact`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            {c.cta}
            <ArrowIcon className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </Container>
  );
}
