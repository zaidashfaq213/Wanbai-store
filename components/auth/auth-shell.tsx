import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { BoltIcon, ShieldIcon, SupportIcon } from "@/components/ui/icons";

export function AuthShell({
  locale,
  brandName,
  panel,
  title,
  subtitle,
  children,
}: {
  locale: Locale;
  brandName: string;
  panel: Dictionary["auth"]["panel"];
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const features = [
    { Icon: BoltIcon, label: panel.instant },
    { Icon: ShieldIcon, label: panel.secure },
    { Icon: SupportIcon, label: panel.support },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden brand-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(30rem 30rem at 80% 10%, rgba(255,255,255,.35), transparent 60%), radial-gradient(28rem 28rem at 10% 90%, rgba(255,255,255,.18), transparent 60%)",
          }}
        />
        <Link href={`/${locale}`} className="relative flex items-center gap-3">
          <span
            aria-hidden
            style={{ backgroundImage: "url(/logo.svg)" }}
            className="size-10 rounded-xl bg-white/15 bg-contain bg-center bg-no-repeat p-1 shadow-sm"
          />
          <span className="text-xl font-black tracking-tight">{brandName}</span>
        </Link>

        <div className="relative">
          <h2 className="max-w-sm text-3xl font-black leading-tight">
            {panel.headline}
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/80">{panel.subtext}</p>
          <ul className="mt-8 flex flex-col gap-3">
            {features.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-semibold">
                <span className="grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <Icon className="size-5" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} {brandName}
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <Link
          href={`/${locale}`}
          className="absolute top-5 text-sm font-semibold text-muted transition-colors hover:text-foreground ltr:right-5 rtl:left-5 lg:hidden"
        >
          {brandName} →
        </Link>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-6 flex flex-col items-center gap-3 text-center lg:items-start lg:text-start">
            <Link
              href={`/${locale}`}
              aria-label={brandName}
              className="grid size-12 place-items-center rounded-2xl bg-surface shadow-[var(--shadow-card)] lg:hidden"
            >
              <span
                aria-hidden
                style={{ backgroundImage: "url(/logo.svg)" }}
                className="size-8 rounded-lg bg-contain bg-center bg-no-repeat"
              />
            </Link>
            <div>
              <h1 className="text-2xl font-black">{title}</h1>
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-7">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
