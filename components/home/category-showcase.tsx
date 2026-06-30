import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Category, Currency } from "@/lib/data/catalog";
import { productsByCategory } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ui/product-card";
import { ArrowIcon, SwipeIcon } from "@/components/ui/icons";

export function CategoryShowcase({
  category,
  locale,
  currency,
  dict,
  limit = 6,
}: {
  category: Category;
  locale: Locale;
  currency: Currency;
  dict: Dictionary;
  limit?: number;
}) {
  const items = productsByCategory(category.slug, limit);
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-10 place-items-center rounded-xl bg-gradient-to-br text-xl",
              category.gradient,
            )}
          >
            {category.icon}
          </span>
          <h2 className="text-lg font-extrabold sm:text-xl">{category.name[locale]}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <SwipeIcon
            aria-hidden
            className="size-5 animate-pulse text-muted sm:hidden"
          />
          <Link
            href={`/${locale}/cards/${category.slug}`}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary-strong"
          >
            {dict.categories.viewAll}
            <ArrowIcon className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
      {/* Mobile: one swipeable row. sm+: responsive grid. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {items.map((product) => (
          <div
            key={product.slug}
            className="w-[42vw] max-w-44 shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <ProductCard
              product={product}
              locale={locale}
              currency={currency}
              dict={dict}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
