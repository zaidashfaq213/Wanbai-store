import type { Dictionary } from "@/lib/i18n/dictionaries";
import { partners, partnerCount } from "@/lib/data/catalog";

export function Partners({ dict }: { dict: Dictionary }) {
  const loop = [...partners, ...partners];
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-surface py-8 shadow-[var(--shadow-card)]">
      <div className="mb-6 text-center">
        <h2 className="text-lg font-extrabold sm:text-xl">{dict.partners.heading}</h2>
        <p className="mt-1 text-sm text-muted">
          {dict.partners.count.replace("{count}", String(partnerCount))}
        </p>
      </div>
      <div className="relative">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent ltr:left-0 rtl:right-0 rtl:bg-gradient-to-l" />
        <div className="pointer-events-none absolute inset-y-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent ltr:right-0 rtl:left-0 rtl:bg-gradient-to-r" />
        <div className="marquee-track flex w-max gap-6 [animation:var(--animate-marquee)]">
          {loop.map((p, i) => (
            <div
              key={`${p.slug}-${i}`}
              className="flex h-16 w-36 shrink-0 items-center justify-center rounded-2xl border border-border bg-white px-5 shadow-sm"
            >
              <span
                role="img"
                aria-label={p.name}
                style={{ backgroundImage: `url(/brands/${p.slug}.svg)` }}
                className="h-7 w-full bg-contain bg-center bg-no-repeat"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
