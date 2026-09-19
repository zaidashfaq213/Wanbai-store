import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getGsmCategoriesWithServices } from "@/lib/data/gsm";
import { formatUsd, fmt, cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BoltIcon, ClockIcon, ShieldIcon, SupportIcon } from "@/components/ui/icons";
import { abs } from "@/lib/seo";

// Same "brand tile" look as a reseller panel: a small initials badge per
// category (e.g. "TM" for TMT Pro Tool) shown to the left of every one of
// its services, colour picked deterministically from the category slug so
// it's stable across renders/locales.
const TINTS = [
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-indigo-600",
];
function tintFor(slug: string) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}
function initialsFor(name: string) {
  const letters = name.replace(/[^A-Za-z؀-ۿ]/g, "");
  return (letters.slice(0, 2) || name.slice(0, 2)).toUpperCase();
}

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

// Every category is rendered on this one page — its name as a section
// heading, its services listed directly underneath — rather than a grid of
// category tiles that each link out to their own page. Matches how a
// reseller-panel catalogue is usually laid out: one continuous scroll,
// grouped by category.
export default async function GsmLandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [dict, categories] = await Promise.all([getDictionary(locale), getGsmCategoriesWithServices()]);
  const g = dict.gsm;
  const totalServices = categories.reduce((n, c) => n + c.services.length, 0);

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
        <div className="flex flex-col gap-10">
          {categories.map((cat) => {
            const catName = locale === "ar" ? cat.nameAr : cat.nameEn;
            const tint = tintFor(cat.slug);
            const initials = initialsFor(catName);
            return (
              <section key={cat.slug} id={cat.slug}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl shadow-sm">
                    {cat.icon}
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold">{catName}</h2>
                    <p className="text-xs font-bold text-muted">
                      {fmt(g.servicesCount, { count: cat.services.length })}
                    </p>
                  </div>
                </div>

                {cat.services.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
                    {g.noServices}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.services.map((svc) => {
                      const svcName = locale === "ar" ? svc.nameAr : svc.nameEn;
                      const processingTime = locale === "ar" ? svc.processingTimeAr : svc.processingTimeEn;
                      const fromPrice =
                        svc.variants.length > 0
                          ? Math.min(...svc.variants.map((v) => v.price))
                          : svc.price;
                      return (
                        <Link
                          key={svc.slug}
                          href={`/${locale}/gsm/${cat.slug}/${svc.slug}`}
                          className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-pop)]"
                        >
                          <span
                            className={cn(
                              "grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-black text-white shadow-sm",
                              tint,
                            )}
                          >
                            {initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-extrabold leading-tight">{svcName}</h3>
                            <p className="mt-0.5 truncate text-xs text-muted">{catName}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-black text-emerald-500">
                                {svc.variants.length > 0
                                  ? `${g.fromPrice} ${formatUsd(fromPrice, locale)}`
                                  : formatUsd(fromPrice, locale)}
                              </span>
                              {processingTime && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-600">
                                  <ClockIcon className="size-3" />
                                  {processingTime}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Container>
  );
}
