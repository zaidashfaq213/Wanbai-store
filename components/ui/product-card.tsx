import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Product, Currency } from "@/lib/data/catalog";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { BoltIcon, StarIcon } from "./icons";

export function ProductArt({
  src,
  name,
  cover = false,
  className = "",
}: {
  src: string;
  name: string;
  cover?: boolean;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={name}
      style={{ backgroundImage: `url(${src})` }}
      className={cn(
        "bg-center bg-no-repeat",
        cover ? "bg-cover" : "bg-contain",
        className,
      )}
    />
  );
}

export function ProductCard({
  product,
  locale,
  dict,
}: {
  product: Product;
  locale: Locale;
  // Kept for call-site compatibility; the card no longer shows a price.
  currency?: Currency;
  dict: Dictionary;
}) {
  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-pop)]"
    >
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden",
          product.image ? "bg-surface-2" : "bg-gradient-to-br from-surface-2 to-surface-3 p-4",
        )}
      >
        <ProductArt
          src={product.image ?? `/products/${product.slug}.svg`}
          cover={Boolean(product.image)}
          name={product.name[locale]}
          className="h-full w-full transition-transform duration-200 group-hover:scale-105"
        />
        <span className="absolute top-2 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm ltr:left-2 rtl:right-2">
          <BoltIcon className="size-3" />
          {product.badge[locale]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-bold">{product.name[locale]}</h3>
        <div className="flex items-center gap-1 text-xs text-muted">
          <StarIcon className="size-3.5 text-warning" />
          <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
          <span>
            ({product.reviews} {dict.product.reviews})
          </span>
        </div>
      </div>
    </Link>
  );
}
