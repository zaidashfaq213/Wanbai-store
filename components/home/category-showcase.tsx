import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Category, Currency, Product } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ui/product-card";
import { ArrowIcon } from "@/components/ui/icons";

export function CategoryShowcase({
  category,
  items,
  locale,
  currency,
  dict,
}: {
  category: Category;
  items: Product[];
  locale: Locale;
  currency: Currency;
  dict: Dictionary;
}) {
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
          <Link
            href={`/${locale}/cards/${category.slug}`}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary-strong"
          >
            {dict.categories.viewAll}
            <ArrowIcon className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
      {/* Responsive grid: 2 columns on phones, scaling up to 6 on desktop. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
    </section>
  );
}
