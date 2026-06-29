import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function Logo({
  locale,
  name,
  className,
}: {
  locale: Locale;
  name: string;
  className?: string;
}) {
  return (
    <Link
      href={`/${locale}`}
      aria-label={name}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden
        style={{ backgroundImage: "url(/logo.svg)" }}
        className="size-9 shrink-0 rounded-xl bg-contain bg-center bg-no-repeat shadow-sm transition-transform group-hover:scale-105"
      />
      <span className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-tight">{name}</span>
      </span>
    </Link>
  );
}
