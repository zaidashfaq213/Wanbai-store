import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getGsmCategoryBySlug } from "@/lib/data/gsm";
import { formatUsd, fmt, cn } from "@/lib/utils";
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

// Same initials badge as the GSM landing page — one per service here, so a
// customer scanning the list can tell services apart at a glance.
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

// Every service in this category is a labelled section: the service's name
// as a heading, then its products listed right under it — never a bare list
// of products with no indication of which service they belong to. A service
// with no products of its own is shown as a single row (itself, at its own
// price), so the page reads the same way top to bottom.
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
        <div className="flex flex-col gap-8">
          {cat.services.map((svc) => {
            const svcName = locale === "ar" ? svc.nameAr : svc.nameEn;
            const desc = locale === "ar" ? svc.descriptionAr : svc.descriptionEn;
            const processingTime = locale === "ar" ? svc.processingTimeAr : svc.processingTimeEn;
            const serviceHref = `/${locale}/gsm/${category}/${svc.slug}`;
            const tint = tintFor(svc.slug);
            // Rows to list under this service's heading: its products, or —
            // for a flat single-price service — the service itself.
            const rows =
              svc.variants.length > 0
                ? svc.variants.map((v) => ({
                    key: v.id,
                    name: locale === "ar" ? v.nameAr : v.nameEn,
                    price: v.price,
                    href: `${serviceHref}?product=${v.id}`,
                  }))
                : [{ key: svc.id, name: svcName, price: svc.price, href: serviceHref }];

            return (
              <section key={svc.slug} id={svc.slug} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
                {/* Service heading */}
                <Link href={serviceHref} className="group flex items-start gap-3 border-b border-border bg-surface-2/60 p-4 transition-colors hover:bg-surface-2">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-black text-white shadow-sm",
                      tint,
                    )}
                  >
                    {initialsFor(svcName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-extrabold leading-tight">{svcName}</h2>
                    {desc && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{desc}</p>}
                    {processingTime && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                        <ClockIcon className="size-3" />
                        {processingTime}
                      </span>
                    )}
                  </div>
                  <ArrowIcon className="mt-1 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>

                {/* Its products, directly under the heading */}
                <ul className="divide-y divide-border">
                  {rows.map((row) => (
                    <li key={row.key}>
                      <Link
                        href={row.href}
                        className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                      >
                        <span className="text-sm font-semibold">{row.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-black text-emerald-500">
                            {formatUsd(row.price, locale)}
                          </span>
                          <span className="text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                            {g.orderNow}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Container>
  );
}
