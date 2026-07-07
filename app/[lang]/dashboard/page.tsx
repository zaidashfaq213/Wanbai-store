import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import {
  getWalletSummary,
  getDashboardCounts,
  getOrders,
} from "@/lib/data/account";
import { formatCents, cn } from "@/lib/utils";
import { CurrencySelector } from "@/components/ui/currency-selector";
import {
  BagIcon,
  HeartIcon,
  BellIcon,
  WalletIcon,
  ArrowIcon,
} from "@/components/ui/icons";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  DELIVERED: "bg-emerald-500/10 text-emerald-500",
  FAILED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-fuchsia-500/10 text-fuchsia-500",
  CANCELLED: "bg-muted/10 text-muted",
};

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

  const [{ balance }, counts, orders] = await Promise.all([
    getWalletSummary(user.id),
    getDashboardCounts(user.id),
    getOrders(user.id),
  ]);
  const recent = orders.slice(0, 4);
  const name = (user.name ?? user.email ?? "").split(" ")[0];

  const stats = [
    { Icon: BagIcon, label: d.nav.orders, value: counts.orders, href: `/${locale}/dashboard/orders`, tint: "text-sky-500 bg-sky-500/10" },
    { Icon: HeartIcon, label: d.nav.favorites, value: counts.favorites, href: `/${locale}/dashboard/favorites`, tint: "text-rose-500 bg-rose-500/10" },
    { Icon: BellIcon, label: d.overview.unread, value: counts.unread, href: `/${locale}/dashboard/notifications`, tint: "text-amber-500 bg-amber-500/10" },
    { Icon: WalletIcon, label: d.nav.wallet, value: formatCents(balance, currency.symbol, currency.rate, locale), href: `/${locale}/dashboard/wallet`, tint: "text-emerald-500 bg-emerald-500/10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-black tracking-tight">
          {d.welcome.replace("{name}", name)}
        </h2>
        <p className="mt-1 text-sm text-muted">{d.overview.subtitle}</p>
      </div>

      {/* Hero + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Balance hero */}
        <div className="relative overflow-hidden rounded-3xl brand-gradient p-6 text-white shadow-[var(--shadow-card)] lg:col-span-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(24rem 24rem at 90% -20%, rgba(255,255,255,.35), transparent 60%)",
            }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <p className="text-sm font-semibold opacity-90">{d.overview.balance}</p>
            <CurrencySelector current={currency.code} />
          </div>
          <p className="relative mt-2 text-4xl font-black">
            {formatCents(balance, currency.symbol, currency.rate, locale)}
          </p>
          <div className="relative mt-5 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/dashboard/wallet`}
              className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold backdrop-blur transition-colors hover:bg-white/30"
            >
              {d.overview.addFunds}
            </Link>
            <Link
              href={`/${locale}/cards`}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary transition-transform hover:scale-[1.02]"
            >
              {d.overview.browse}
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-3xl border border-border bg-surface p-5">
          <p className="mb-3 text-sm font-bold text-muted">{d.overview.quickActions}</p>
          <div className="flex flex-col gap-1.5">
            {[
              { label: d.nav.orders, href: `/${locale}/dashboard/orders` },
              { label: d.nav.favorites, href: `/${locale}/dashboard/favorites` },
              { label: d.nav.wallet, href: `/${locale}/dashboard/wallet` },
              { label: d.nav.profile, href: `/${locale}/dashboard/profile` },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
              >
                {a.label}
                <ArrowIcon className="size-4 text-muted rtl:rotate-180" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
          >
            <span className={cn("grid size-10 place-items-center rounded-xl", s.tint)}>
              <s.Icon className="size-5" />
            </span>
            <p className="mt-3 text-xl font-black">{s.value}</p>
            <p className="text-xs font-semibold text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold">{d.overview.recentOrders}</h3>
          {orders.length > 0 && (
            <Link
              href={`/${locale}/dashboard/orders`}
              className="text-sm font-bold text-primary hover:underline"
            >
              {d.overview.viewAll}
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{d.overview.emptyRecent}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {o.items[0]?.productName ?? o.ref}
                  </p>
                  <p className="text-xs text-muted">{o.ref}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-bold",
                      STATUS_STYLES[o.status] ?? STATUS_STYLES.PENDING,
                    )}
                  >
                    {(d.orders.statuses as Record<string, string>)[o.status]}
                  </span>
                  <span className="text-sm font-black text-primary">
                    {formatCents(o.total, currency.symbol, currency.rate, locale)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
