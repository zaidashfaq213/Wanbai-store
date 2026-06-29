"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { categories } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { CurrencySelector } from "@/components/ui/currency-selector";
import {
  ChevronDownIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";

export function Header({
  dict,
  locale,
  currencyCode,
}: {
  dict: Dictionary;
  locale: Locale;
  currencyCode: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-200",
        scrolled
          ? "glass border-border shadow-[var(--shadow-card)]"
          : "border-transparent bg-background",
      )}
    >
      <Container className="flex h-16 items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={dict.header.allCategories}
          className="grid size-9 place-items-center rounded-xl border border-border bg-surface lg:hidden"
        >
          <MenuIcon className="size-5" />
        </button>

        <Logo locale={locale} name={dict.brand.name} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex ltr:ml-2 rtl:mr-2">
          <Link
            href={`/${locale}`}
            className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-2"
          >
            {dict.header.home}
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMegaOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-2"
              aria-expanded={megaOpen}
            >
              {dict.header.allCategories}
              <ChevronDownIcon className="size-4 text-muted" />
            </button>
            {megaOpen && (
              <div className="absolute top-full z-50 w-[34rem] pt-2 ltr:left-0 rtl:right-0">
                <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-pop)]">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/${locale}/cards/${c.slug}`}
                      className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-2"
                    >
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-xl bg-gradient-to-br text-lg",
                          c.gradient,
                        )}
                      >
                        {c.icon}
                      </span>
                      <span className="text-sm font-semibold">{c.name[locale]}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Search (desktop) */}
        <div className="relative hidden flex-1 md:block">
          <SearchIcon className="pointer-events-none absolute top-1/2 size-[18px] -translate-y-1/2 text-muted ltr:left-3 rtl:right-3" />
          <input
            type="search"
            placeholder={dict.header.search}
            className="h-10 w-full rounded-xl border border-border bg-surface-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4"
          />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 ltr:ml-auto rtl:mr-auto md:ltr:ml-0 md:rtl:mr-0">
          <CurrencySelector current={currencyCode} />
          <LanguageSwitcher locale={locale} />
          <ThemeToggle label={dict.header.theme} />
          <Link
            href={`/${locale}/login`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl brand-gradient px-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <UserIcon className="size-[18px]" />
            <span className="hidden sm:inline">{dict.header.login}</span>
          </Link>
        </div>
      </Container>

      {/* Mobile search */}
      <Container className="pb-3 md:hidden">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 size-[18px] -translate-y-1/2 text-muted ltr:left-3 rtl:right-3" />
          <input
            type="search"
            placeholder={dict.header.search}
            className="h-10 w-full rounded-xl border border-border bg-surface-2 text-sm outline-none placeholder:text-muted focus:border-primary/50 focus:bg-surface ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4"
          />
        </div>
      </Container>

      {/* Mobile categories drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 w-80 max-w-[85vw] overflow-y-auto bg-surface p-4 shadow-[var(--shadow-pop)] ltr:left-0 rtl:right-0">
            <div className="mb-4 flex items-center justify-between">
              <Logo locale={locale} name={dict.brand.name} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={dict.header.home}
                className="grid size-9 place-items-center rounded-xl border border-border"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted">
              {dict.header.allCategories}
            </p>
            <nav className="flex flex-col gap-1">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${locale}/cards/${c.slug}`}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-2"
                >
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl bg-gradient-to-br text-lg",
                      c.gradient,
                    )}
                  >
                    {c.icon}
                  </span>
                  <span className="text-sm font-semibold">{c.name[locale]}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
