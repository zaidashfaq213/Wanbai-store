import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getGsmCategories } from "@/lib/data/gsm";
import { cn, fmt } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowIcon, BoltIcon, ShieldIcon, SupportIcon } from "@/components/ui/icons";
import { abs } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.gsm.metaTitle} | ${dict.brand.name}`,
    description: dict.gsm.heroSubtitle,
    alternates: { canonical: abs(`/${locale}/gsm`) },
  };
}

const CARD_TINTS = [
  "from-sky-500/15 to-sky-500/5 text-sky-500",
  "from-violet-500/15 to-violet-500/5 text-violet-500",
  "from-amber-500/15 to-amber-500/5 text-amber-500",
  "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
  "from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-500",
  "from-rose-500/15 to-rose-500/5 text-rose-500",
];

function tintFor(slug: string) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CARD_TINTS[h % CARD_TINTS.length];
}

export default async function GsmLandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [dict, categories] = await Promise.all([getDictionary(locale), getGsmCategories()]);
  const g = dict.gsm;
  const totalServices = categories.reduce((n, c) => n + c._count.services, 0);

  const trust = [
    { Icon: ShieldIcon, label: g.trustSecure },
    { Icon: BoltIcon, label: g.trustFast },
    { Icon: SupportIcon, label: g.trustSupport },
  ];

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs items={[{ label: dict.header.home, href: `/${locale}` }, { label: g.heroTitle }]} />

      {/* Hero */}
      <header className="relative mb-10 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 text-[10rem] opacity-[0.06] ltr:-right-8 rtl:-left-8"
        >
          🛠️
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          🛠️ {g.heroTitle}
        </span>
        <h1 className="mt-3 max-w-xl text-3xl font-black leading-tight sm:text-4xl">{g.heroTitle}</h1>
        <p className="mt-2 max-w-xl text-muted">{g.heroSubtitle}</p>

        {categories.length > 0 && (
          <p className="mt-4 text-sm font-bold text-primary">
            {fmt(g.categoriesServicesCount, { categories: categories.length, services: totalServices })}
          </p>
        )}

        <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
          {trust.map(({ Icon, label }, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface/80 p-3 text-center backdrop-blur"
            >
              <Icon className="size-5 text-primary" />
              <span className="text-[11px] font-bold leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </header>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {g.noCategories}
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-lg font-extrabold">{g.categoriesTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => {
              const tint = tintFor(c.slug);
              return (
                <Link
                  key={c.slug}
                  href={`/${locale}/gsm/${c.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-pop)]"
                >
                  <div
                    className={cn(
                      "grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-sm transition-transform group-hover:scale-110",
                      tint,
                    )}
                  >
                    {c.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold">{locale === "ar" ? c.nameAr : c.nameEn}</h3>
                  <p className="mt-0.5 text-sm text-muted">{fmt(g.servicesCount, { count: c._count.services })}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
                    {g.orderNow}
                    <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </Container>
  );
}
