import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getCategories, getAllProducts } from "@/lib/data/catalog-db";
import { cn, fmt } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowIcon } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.catalog.title} | ${dict.brand.name}`,
    description: dict.catalog.subtitle,
    alternates: { canonical: `/${locale}/cards` },
  };
}

export default async function CardsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [dict, categories, products] = await Promise.all([
    getDictionary(locale),
    getCategories(),
    getAllProducts(),
  ]);

  const countFor = (slug: string) =>
    products.filter((p) => p.category === slug).length;

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: dict.header.home, href: `/${locale}` },
          { label: dict.catalog.title },
        ]}
      />

      <header className="mb-8">
        <h1 className="text-2xl font-black sm:text-3xl">{dict.catalog.title}</h1>
        <p className="mt-1 text-muted">{dict.catalog.subtitle}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/${locale}/cards/${c.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-pop)]"
          >
            <div
              className={cn(
                "grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-sm transition-transform group-hover:scale-110",
                c.gradient,
              )}
            >
              {c.icon}
            </div>
            <h2 className="mt-4 text-lg font-extrabold">{c.name[locale]}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {fmt(dict.catalog.productsCount, { count: countFor(c.slug) })}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
              {dict.catalog.browse}
              <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
