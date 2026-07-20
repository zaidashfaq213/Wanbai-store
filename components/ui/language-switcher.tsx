"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, localeLabels, type Locale } from "@/lib/i18n/config";
import { setCookie } from "@/lib/utils";
import { GlobeIcon } from "./icons";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    setCookie("NEXT_LOCALE", next);
    const segments = pathname.split("/");
    segments[1] = next; // replace the leading locale segment
    router.push(segments.join("/") || `/${next}`);
  }

  const other = locales.find((l) => l !== locale)!;

  return (
    <button
      type="button"
      onClick={() => switchTo(other)}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-sm font-semibold transition-colors hover:bg-surface-2 hover:text-primary"
      aria-label={localeLabels[other]}
      title={localeLabels[other]}
    >
      <GlobeIcon className="size-[18px]" />
      {/* Show the language you'd switch TO — e.g. "English" on the Arabic site. */}
      <span className="hidden sm:inline">{localeLabels[other]}</span>
    </button>
  );
}
