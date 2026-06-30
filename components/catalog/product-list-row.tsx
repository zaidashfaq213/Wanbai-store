import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Product, Currency } from "@/lib/data/catalog";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn, formatPrice } from "@/lib/utils";
import { ProductArt } from "@/components/ui/product-card";
import { StarRating } from "@/components/ui/star-rating";
import { ArrowIcon, BoltIcon } from "@/components/ui/icons";

export function ProductListRow({
  product,
  locale,
  currency,
  dict,
}: {
  product: Product;
  locale: Locale;
  currency: Currency;
  dict: Dictionary;
}) {
  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)] transition-all hover:border-primary/40 hover:shadow-[var(--shadow-pop)]"
    >
      <div
        className={cn(
          "relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24",
          product.image ? "bg-surface-2" : "bg-gradient-to-br from-surface-2 to-surface-3 p-2.5",
        )}
      >
        <ProductArt
          src={product.image ?? `/products/${product.slug}.svg`}
          cover={Boolean(product.image)}
          name={product.name[locale]}
          className="h-full w-full"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold">{product.name[locale]}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          <StarRating value={product.rating} size="size-3.5" />
          <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
          <span>({product.reviews})</span>
        </div>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          <BoltIcon className="size-3" />
          {product.badge[locale]}
        </span>
      </div>
      <div className="flex flex-col items-end gap-2 ltr:text-right rtl:text-left">
        <div className="leading-tight">
          <span className="block text-[11px] text-muted">{dict.product.from}</span>
          <span className="text-base font-extrabold text-primary">
            {formatPrice(product.priceFrom, currency.symbol, currency.rate, locale)}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg brand-gradient px-3 py-1.5 text-xs font-bold text-white">
          {dict.product.buyNow}
          <ArrowIcon className="size-3.5 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
