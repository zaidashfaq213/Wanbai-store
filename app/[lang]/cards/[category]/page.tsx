import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { categories, products } from "@/lib/data/catalog";
import { getCurrency } from "@/lib/data/currency";
import { fmt } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CategoryTabBar } from "@/components/catalog/category-tab-bar";
import { ViewToggle } from "@/components/catalog/view-toggle";
import { Pagination } from "@/components/catalog/pagination";
import { ProductCard } from "@/components/ui/product-card";
import { ProductListRow } from "@/components/catalog/product-list-row";

const PAGE_SIZE = 10;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string }>;
}): Promise<Metadata> {
  const { lang, category: slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  const name = category.name[locale];
  return {
    title: `${name} | ${dict.brand.name}`,
    description: `${name} — ${dict.meta.description}`,
    alternates: { canonical: `/${locale}/cards/${slug}` },
    openGraph: { title: `${name} | ${dict.brand.name}`, type: "website" },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; category: string }>;
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const { lang, category: slug } = await params;
  const { view: viewParam, page: pageParam } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const dict = await getDictionary(locale);
  const currency = await getCurrency();

  const all = products.filter((p) => p.category === slug);
  const view: "grid" | "list" = viewParam === "list" ? "list" : "grid";
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const basePath = `/${locale}/cards/${slug}`;

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: dict.header.home, href: `/${locale}` },
          { label: dict.catalog.title, href: `/${locale}/cards` },
          { label: category.name[locale] },
        ]}
      />

      <CategoryTabBar locale={locale} activeSlug={slug} />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">{category.name[locale]}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {fmt(dict.listing.results, { count: all.length })}
          </p>
        </div>
        <ViewToggle basePath={basePath} view={view} dict={dict} />
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-10 text-center text-muted">
          {dict.listing.empty}
        </p>
      ) : view === "list" ? (
        <div className="flex flex-col gap-3">
          {items.map((product) => (
            <ProductListRow
              key={product.slug}
              product={product}
              locale={locale}
              currency={currency}
              dict={dict}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              locale={locale}
              currency={currency}
              dict={dict}
            />
          ))}
        </div>
      )}

      <Pagination
        basePath={basePath}
        page={page}
        totalPages={totalPages}
        extraQuery={view === "list" ? { view: "list" } : undefined}
        dict={dict}
      />
    </Container>
  );
}
