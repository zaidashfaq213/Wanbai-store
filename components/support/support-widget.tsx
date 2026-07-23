"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { SupportIcon, CloseIcon, SearchIcon, ChevronLeftIcon } from "@/components/ui/icons";

type Faq = { q: string; a: string };

export type SupportWidgetDict = {
  button: string;
  title: string;
  subtitle: string;
  intro: string;
  search: string;
  noResults: string;
  back: string;
  stillNeedHelp: string;
  contactUs: string;
  openTicket: string;
  close: string;
  faqs: Faq[];
};

/**
 * Floating "Need help?" widget, bottom corner on every customer-facing page.
 * Answers are a fixed, hardcoded FAQ list (no AI, no network call) — it exists
 * to deflect the most common questions instantly; anything else routes to the
 * real contact channels (WhatsApp / ticket) already on the Contact page.
 */
export function SupportWidget({
  locale,
  dict,
}: {
  locale: Locale;
  dict: SupportWidgetDict;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Faq | null>(null);

  const isRTL = locale === "ar";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dict.faqs;
    return dict.faqs.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
    );
  }, [query, dict.faqs]);

  // Hide on the admin panel — it's a storefront/customer support tool.
  if (pathname?.includes("/admin")) return null;

  function toggle() {
    setOpen((v) => !v);
    if (open) {
      setActive(null);
      setQuery("");
    }
  }

  return (
    <div className="fixed bottom-20 z-[90] ltr:right-4 rtl:left-4 md:bottom-5 md:ltr:right-5 md:rtl:left-5">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)]">
          {/* Header */}
          <div className="brand-gradient flex items-center justify-between px-4 py-3.5 text-white">
            <div>
              <p className="text-sm font-black">{dict.title}</p>
              <p className="text-xs text-white/85">{dict.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={dict.close}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>

          {active ? (
            /* Answer view */
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="mb-3 inline-flex w-fit items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <ChevronLeftIcon className={cn("size-3.5", isRTL && "rotate-180")} />
                {dict.back}
              </button>
              <div className="flex flex-col gap-2">
                <div className="self-end rounded-2xl rounded-tr-sm brand-gradient px-3.5 py-2.5 text-sm font-semibold text-white ltr:ml-8 rtl:mr-8">
                  {active.q}
                </div>
                <div className="self-start rounded-2xl rounded-tl-sm border border-border bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed ltr:mr-8 rtl:ml-8">
                  {active.a}
                </div>
              </div>
            </div>
          ) : (
            /* Question list */
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="p-3">
                <p className="mb-2.5 text-xs leading-relaxed text-muted">{dict.intro}</p>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted ltr:left-3 rtl:right-3" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={dict.search}
                    className="h-10 w-full rounded-xl border border-border bg-surface-2 text-sm outline-none placeholder:text-muted focus:border-primary/50 ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-2">
                {results.length === 0 ? (
                  <p className="p-3 text-center text-sm text-muted">{dict.noResults}</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {results.map((f) => (
                      <li key={f.q}>
                        <button
                          type="button"
                          onClick={() => setActive(f)}
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-start text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-surface-2"
                        >
                          {f.q}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Footer — escape hatch to real humans */}
          <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-2 px-3.5 py-2.5">
            <span className="text-[11px] font-semibold text-muted">{dict.stillNeedHelp}</span>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/${locale}/contact`}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] font-bold transition-colors hover:bg-background"
              >
                {dict.contactUs}
              </Link>
              <Link
                href={`/${locale}/dashboard/tickets`}
                onClick={() => setOpen(false)}
                className="rounded-lg brand-gradient px-2.5 py-1.5 text-[11px] font-bold text-white"
              >
                {dict.openTicket}
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={dict.button}
        title={dict.button}
        className={cn(
          "grid size-14 place-items-center rounded-full text-white shadow-[var(--shadow-pop)] transition-transform hover:scale-105 active:scale-95",
          open ? "bg-foreground" : "brand-gradient",
        )}
      >
        {open ? <CloseIcon className="size-6" /> : <SupportIcon className="size-6" />}
      </button>
    </div>
  );
}
