import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { testimonials } from "@/lib/data/catalog";
import { StarIcon } from "@/components/ui/icons";

export function Testimonials({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <section>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-black sm:text-2xl">{dict.testimonials.heading}</h2>
        <p className="mt-1 text-sm text-muted">{dict.testimonials.subheading}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex gap-0.5 text-warning">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="size-4" />
              ))}
            </div>
            <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
              “{t.quote[locale]}”
            </blockquote>
            <figcaption className="flex items-center gap-3">
              <span
                className="grid size-10 place-items-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: `hsl(${t.hue} 70% 55%)` }}
                aria-hidden
              >
                {t.initial}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold">{t.name[locale]}</span>
                <span className="text-xs text-muted">{dict.testimonials.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
