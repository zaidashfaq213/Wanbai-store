import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getWalletSummary, getDashboardCounts } from "@/lib/data/account";
import { formatCents } from "@/lib/utils";
import { CurrencySelector } from "@/components/ui/currency-selector";

export default async function DashboardOverview({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const user = await requireUser(locale);
  const dict = await getDictionary(locale);
  const d = dict.dashboard;
  const currency = await getCurrency();

  const [{ balance }, counts] = await Promise.all([
    getWalletSummary(user.id),
    getDashboardCounts(user.id),
  ]);

  const stats = [
    { label: d.nav.orders, value: counts.orders, href: `/${locale}/dashboard/orders` },
    { label: d.nav.favorites, value: counts.favorites, href: `/${locale}/dashboard/favorites` },
    { label: d.overview.unread, value: counts.unread, href: `/${locale}/dashboard/notifications` },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Wallet balance */}
      <div className="rounded-2xl brand-gradient p-5 text-white shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold opacity-90">{d.overview.balance}</p>
          <CurrencySelector current={currency.code} />
        </div>
        <p className="mt-1 text-3xl font-black">
          {formatCents(balance, currency.symbol, currency.rate, locale)}
        </p>
        <Link
          href={`/${locale}/dashboard/wallet`}
          className="mt-3 inline-flex rounded-xl bg-white/20 px-3.5 py-2 text-sm font-bold backdrop-blur transition-colors hover:bg-white/30"
        >
          {d.overview.topUp}
        </Link>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
          >
            <p className="text-2xl font-black text-primary">{s.value}</p>
            <p className="mt-0.5 text-xs font-semibold text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick action */}
      <Link
        href={`/${locale}/cards`}
        className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-4 text-sm font-bold text-primary transition-colors hover:bg-surface-2"
      >
        {d.overview.browse}
      </Link>
    </div>
  );
}
