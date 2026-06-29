"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "@/components/ui/icons";

const slideThemes = [
  {
    gradient: "from-violet-600 via-fuchsia-600 to-pink-600",
    target: "game-fill",
    chips: ["free-fire", "pubg-mobile", "call-of-duty", "genshin-impact", "mobile-legends"],
  },
  {
    gradient: "from-sky-600 via-cyan-600 to-teal-500",
    target: "game-cards",
    chips: ["steam", "playstation", "xbox", "roblox", "itunes"],
  },
  {
    gradient: "from-rose-600 via-red-600 to-orange-500",
    target: "app-subscriptions",
    chips: ["netflix", "spotify", "shahid-vip", "nordvpn", "youtube"],
  },
];

// scattered positions for the floating product tiles (end side of the banner)
const chipPositions = [
  "top-6 size-20 ltr:right-10 rtl:left-10 rotate-[-8deg]",
  "top-24 size-24 ltr:right-40 rtl:left-40 rotate-[6deg]",
  "bottom-8 size-16 ltr:right-16 rtl:left-16 rotate-[10deg]",
  "top-10 size-16 ltr:right-64 rtl:left-64 rotate-[-4deg]",
  "bottom-12 size-20 ltr:right-48 rtl:left-48 rotate-[-12deg]",
];

export function HeroSlider({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const slides = dict.hero.slides;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="relative h-[260px] sm:h-[320px] lg:h-[380px]">
        {slides.map((slide, i) => {
          const theme = slideThemes[i % slideThemes.length];
          return (
            <div
              key={i}
              className={cn(
                "absolute inset-0 bg-gradient-to-br transition-opacity duration-700",
                theme.gradient,
                i === index ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {/* decorative glow */}
              <div className="absolute -top-24 size-72 rounded-full bg-white/20 blur-3xl ltr:-right-10 rtl:-left-10" />
              <div className="absolute bottom-0 size-64 rounded-full bg-black/20 blur-3xl ltr:left-10 rtl:right-10" />

              {/* floating product tiles */}
              <div className="pointer-events-none absolute inset-0 hidden lg:block">
                {theme.chips.map((slug, c) => (
                  <div
                    key={slug}
                    style={{ backgroundImage: `url(/products/${slug}.svg)` }}
                    className={cn(
                      "absolute rounded-2xl bg-contain bg-center bg-no-repeat shadow-2xl ring-1 ring-white/20",
                      chipPositions[c],
                    )}
                  />
                ))}
              </div>
              <div className="relative flex h-full flex-col justify-center gap-4 p-7 sm:p-12 lg:max-w-2xl">
                <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {slide.eyebrow}
                </span>
                <h2 className="text-2xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  {slide.title}
                </h2>
                <p className="max-w-md text-sm text-white/90 sm:text-base">
                  {slide.subtitle}
                </p>
                <Link
                  href={`/${locale}/cards/${theme.target}`}
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-zinc-900 shadow-lg transition-transform hover:scale-[1.03]"
                >
                  {slide.cta}
                  <ArrowIcon className="size-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* dots */}
      <div className="absolute bottom-4 flex items-center gap-2 ltr:left-7 ltr:sm:left-12 rtl:right-7 rtl:sm:right-12">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-2 rounded-full bg-white transition-all",
              i === index ? "w-7 opacity-100" : "w-2 opacity-50 hover:opacity-80",
            )}
          />
        ))}
      </div>
    </div>
  );
}
