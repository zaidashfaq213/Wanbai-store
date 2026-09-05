import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getGsmCategoryBySlug } from "@/lib/data/gsm";
import { formatUsd, fmt } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowIcon, ClockIcon } from "@/components/ui/icons";
import { abs } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string }>;
}): Promise<Metadata> {
  const { lang, category } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const cat = await getGsmCategoryBySlug(category);
  if (!cat) return {};
  const name = locale === "ar" ? cat.nameAr : cat.nameEn;
  return {
    title: name,
    alternates: { canonical: abs(`/${locale}/gsm/${category}`) },
  };
}

export default async function GsmCategoryPage({
  params,
}: {
  params: Promise<{ lang: string; category: string }>;
}) {
  const { lang, category } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [dict, cat] = await Promise.all([
    getDictionary(locale),
    getGsmCategoryBySlug(category),
  ]);
  if (!cat) notFound();
  const g = dict.gsm;
  const name = locale === "ar" ? cat.nameAr : cat.nameEn;

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: dict.header.home, href: `/${locale}` },
          { label: g.heroTitle, href: `/${locale}/gsm` },
          { label: name },
        ]}
      />

      <header className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-10 text-8xl opacity-[0.08] ltr:-right-4 rtl:-left-4">
          {cat.icon}
        </div>
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-4xl shadow-sm">
            {cat.icon}
          </span>
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">{name}</h1>
            <p className="mt-1 text-sm font-bold text-primary">
              {fmt(g.servicesCount, { count: cat.services.length })}
            </p>
          </div>
        </div>
      </header>

      {cat.services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {g.noServices}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cat.services.map((svc) => {
            const svcName = locale === "ar" ? svc.nameAr : svc.nameEn;
            const desc = locale === "ar" ? svc.descriptionAr : svc.descriptionEn;
            const processingTime = locale === "ar" ? svc.processingTimeAr : svc.processingTimeEn;
            return (
              <Link
                key={svc.slug}
                href={`/${locale}/gsm/${category}/${svc.slug}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-pop)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-extrabold leading-tight">{svcName}</h2>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                    {formatUsd(svc.price, locale)}
                  </span>
                </div>
                {desc && <p className="line-clamp-2 flex-1 text-sm text-muted">{desc}</p>}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  {processingTime ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                      <ClockIcon className="size-3.5" />
                      {processingTime}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                    {g.orderNow}
                    <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
