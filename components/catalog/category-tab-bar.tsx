import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Category } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

export function CategoryTabBar({
  locale,
  activeSlug,
  categories,
}: {
  locale: Locale;
  activeSlug?: string;
  categories: Category[];
}) {
  return (
    <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
      <Link
        href={`/${locale}/cards`}
        className={cn(
          "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
          !activeSlug
            ? "border-transparent brand-gradient text-white"
            : "border-border bg-surface hover:bg-surface-2",
        )}
      >
        {locale === "ar" ? "الكل" : "All"}
      </Link>
      {categories.map((c) => {
        const active = c.slug === activeSlug;
        return (
          <Link
            key={c.slug}
            href={`/${locale}/cards/${c.slug}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
              active
                ? "border-transparent brand-gradient text-white"
                : "border-border bg-surface hover:bg-surface-2",
            )}
          >
            <span aria-hidden>{c.icon}</span>
            {c.name[locale]}
          </Link>
        );
      })}
    </div>
  );
}
