import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

export function AuthShell({
  locale,
  brandName,
  title,
  subtitle,
  children,
}: {
  locale: Locale;
  brandName: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Subtle brand glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60rem 40rem at 50% -10%, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 70%)",
        }}
      />

      {/* Back to store */}
      <Link
        href={`/${locale}`}
        className="absolute top-5 text-sm font-semibold text-muted transition-colors hover:text-foreground ltr:left-5 rtl:right-5"
      >
        ← {brandName}
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link
            href={`/${locale}`}
            aria-label={brandName}
            className="grid size-14 place-items-center rounded-2xl bg-surface shadow-[var(--shadow-card)]"
          >
            <span
              aria-hidden
              style={{ backgroundImage: "url(/logo.svg)" }}
              className="size-9 rounded-lg bg-contain bg-center bg-no-repeat"
            />
          </Link>
          <div>
            <h1 className="text-2xl font-black">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          {children}
        </div>
      </div>
    </div>
  );
}
