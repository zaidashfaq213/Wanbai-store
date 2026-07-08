import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { searchProducts } from "@/lib/data/catalog-db";
import { getCurrency } from "@/lib/data/currency";
import { fmt } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductCard } from "@/components/ui/product-card";
import { SearchIcon } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return { title: `${dict.search.title} | ${dict.brand.name}` };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { lang } = await params;
  const { q = "" } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const currency = await getCurrency();

  const query = q.trim();
  const results = query ? await searchProducts(query) : [];

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: dict.header.home, href: `/${locale}` },
          { label: dict.search.title },
        ]}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          {query ? fmt(dict.search.resultsFor, { q }) : dict.search.title}
        </h1>
        {query && (
          <p className="mt-1 text-muted">
            {fmt(dict.search.count, { count: results.length })}
          </p>
        )}
      </header>

      {query && results.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              locale={locale}
              currency={currency}
              dict={dict}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
            <SearchIcon className="size-7" />
          </span>
          <p className="font-bold">{dict.search.empty}</p>
          <p className="text-sm text-muted">{dict.search.emptyHint}</p>
        </div>
      )}
    </Container>
  );
}
