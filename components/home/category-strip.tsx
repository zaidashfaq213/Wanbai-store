import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { categories } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

export function CategoryStrip({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-extrabold sm:text-xl">
        {dict.categories.heading}
      </h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/${locale}/cards/${c.slug}`}
            className="group flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 sm:w-auto"
          >
            <span
              className={cn(
                "grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-sm transition-transform group-hover:scale-110",
                c.gradient,
              )}
            >
              {c.icon}
            </span>
            <span className="text-xs font-semibold leading-tight">{c.name[locale]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
