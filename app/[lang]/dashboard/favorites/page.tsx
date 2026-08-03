import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getFavorites } from "@/lib/data/account";
import { getAllProducts } from "@/lib/data/catalog-db";
import { removeFavorite } from "@/lib/actions/account";
import { ProductCard } from "@/components/ui/product-card";
import { CloseIcon, HeartIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict, currency] = await Promise.all([
    requireUser(locale),
    getDictionary(locale),
    getCurrency(),
  ]);
  const d = dict.dashboard.favorites;

  const [favorites, allProducts] = await Promise.all([
    getFavorites(user.id),
    getAllProducts(),
  ]);
  const bySlug = new Map(allProducts.map((p) => [p.slug, p]));
  const items = favorites
    .map((f) => bySlug.get(f.productSlug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title={d.title} subtitle={d.subtitle} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
            <HeartIcon className="size-7" />
          </span>
          <p className="text-sm text-muted">{d.empty}</p>
          <Link
            href={`/${locale}/cards`}
            className="rounded-xl brand-gradient px-4 py-2.5 text-sm font-bold text-white"
          >
            {dict.dashboard.overview.browse}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((product) => (
          <div key={product.slug} className="relative">
            <form
              action={removeFavorite}
              className="absolute top-1.5 z-10 ltr:right-1.5 rtl:left-1.5"
            >
              <input type="hidden" name="productSlug" value={product.slug} />
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                aria-label={d.remove}
                title={d.remove}
                className="grid size-7 place-items-center rounded-full bg-background/80 text-muted shadow-sm backdrop-blur transition-colors hover:text-red-500"
              >
                <CloseIcon className="size-4" />
              </button>
            </form>
            <ProductCard
              product={product}
              locale={locale}
              currency={currency}
              dict={dict}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
