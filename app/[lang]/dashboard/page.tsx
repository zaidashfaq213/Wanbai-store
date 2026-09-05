import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import {
  getWalletSummary,
  getGsmWalletSummary,
  getDashboardCounts,
  getOrders,
} from "@/lib/data/account";
import { formatCents, formatUsd, cn } from "@/lib/utils";
import { CurrencySelector } from "@/components/ui/currency-selector";
import {
  BagIcon,
  HeartIcon,
  BellIcon,
  WalletIcon,
  UserIcon,
  ArrowIcon,
  BoltIcon,
} from "@/components/ui/icons";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  DELIVERED: "bg-emerald-500/10 text-emerald-500",
  FAILED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-fuchsia-500/10 text-fuchsia-500",
  CANCELLED: "bg-muted/10 text-muted",
};

// A stable, decorative colour per product name — same idea as the product
// cards' hue-based art, just derived from the name since order history only
// snapshots the name/label, not the live product's hue.
const AVATAR_TINTS = [
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];
function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

export default async function DashboardOverview({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict, currency] = await Promise.all([
    requireUser(locale),
    getDictionary(locale),
    getCurrency(),
  ]);
  const d = dict.dashboard;

  const [{ balance }, { balance: gsmBalance }, counts, orders] = await Promise.all([
    getWalletSummary(user.id),
    getGsmWalletSummary(user.id),
    getDashboardCounts(user.id),
    getOrders(user.id),
  ]);
  const recent = orders.slice(0, 5);
  const name = (user.name ?? user.email ?? "").split(" ")[0];
  const hour = new Date().getHours();
  const greetingEmoji = hour < 12 ? "☀️" : hour < 18 ? "🌤️" : "🌙";

  const stats = [
    { Icon: BagIcon, label: d.nav.orders, value: counts.orders, href: `/${locale}/dashboard/orders`, tint: "text-sky-500", bar: "bg-sky-500" },
    { Icon: HeartIcon, label: d.nav.favorites, value: counts.favorites, href: `/${locale}/dashboard/favorites`, tint: "text-rose-500", bar: "bg-rose-500" },
    { Icon: BellIcon, label: d.overview.unread, value: counts.unread, href: `/${locale}/dashboard/notifications`, tint: "text-amber-500", bar: "bg-amber-500" },
    { Icon: WalletIcon, label: d.nav.wallet, value: formatCents(balance, currency.symbol, currency.rate, locale), href: `/${locale}/dashboard/wallet`, tint: "text-emerald-500", bar: "bg-emerald-500" },
    { Icon: WalletIcon, label: d.nav.gsmWallet, value: formatUsd(gsmBalance, locale), href: `/${locale}/dashboard/gsm-wallet`, tint: "text-violet-500", bar: "bg-violet-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl">
          {greetingEmoji}
        </span>
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            {d.welcome.split("{name}")[0]}
            <span className="brand-text">{name}</span>
            {d.welcome.split("{name}")[1]}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{d.overview.subtitle}</p>
        </div>
      </div>

      {/* Hero + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Balance hero */}
        <div className="relative overflow-hidden rounded-3xl brand-gradient p-6 text-white shadow-[var(--shadow-pop)] lg:col-span-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(24rem 24rem at 90% -20%, rgba(255,255,255,.35), transparent 60%)",
            }}
          />
          <WalletIcon
            aria-hidden
            className="pointer-events-none absolute -bottom-6 size-40 text-white/10 ltr:-right-6 rtl:-left-6"
          />
          <div className="relative flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold backdrop-blur">
              <WalletIcon className="size-3.5" />
              {d.overview.balance}
            </span>
            <CurrencySelector current={currency.code} />
          </div>
          <p className="relative mt-4 text-5xl font-black tracking-tight">
            {formatCents(balance, currency.symbol, currency.rate, locale)}
          </p>
          <div className="relative mt-6 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/dashboard/wallet`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold backdrop-blur transition-colors hover:bg-white/30"
            >
              <BoltIcon className="size-4" />
              {d.overview.addFunds}
            </Link>
            <Link
              href={`/${locale}/cards`}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-sm transition-transform hover:scale-[1.02]"
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
              { Icon: BagIcon, label: d.nav.orders, href: `/${locale}/dashboard/orders` },
              { Icon: HeartIcon, label: d.nav.favorites, href: `/${locale}/dashboard/favorites` },
              { Icon: WalletIcon, label: d.nav.wallet, href: `/${locale}/dashboard/wallet` },
              { Icon: UserIcon, label: d.nav.profile, href: `/${locale}/dashboard/profile` },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:brand-gradient group-hover:text-white">
                  <a.Icon className="size-4" />
                </span>
                <span className="flex-1">{a.label}</span>
                <ArrowIcon className="size-4 text-muted transition-transform rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
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
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
          >
            <span className={cn("absolute inset-y-0 w-1 ltr:left-0 rtl:right-0", s.bar)} />
            <div className="flex items-center justify-between">
              <span className={cn("grid size-10 place-items-center rounded-xl bg-surface-2", s.tint)}>
                <s.Icon className="size-5" />
              </span>
              <ArrowIcon className="size-3.5 text-muted opacity-0 transition-opacity rtl:rotate-180 group-hover:opacity-100" />
            </div>
            <p className="mt-3 text-2xl font-black tabular-nums">{s.value}</p>
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
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-2xl">🛍️</span>
            <p className="text-sm text-muted">{d.overview.emptyRecent}</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recent.map((o) => {
              const productName = o.items[0]?.productName ?? o.ref;
              return (
                <li key={o.id}>
                  <Link
                    href={`/${locale}/dashboard/orders/${o.ref}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-surface-2 -mx-2 px-2 rounded-xl"
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-black text-white",
                        tintFor(productName),
                      )}
                    >
                      {productName.trim().slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{productName}</p>
                      <p className="text-xs text-muted">
                        {o.ref} · {new Date(o.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-black text-primary">
                        {formatCents(o.total, currency.symbol, currency.rate, locale)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                          STATUS_STYLES[o.status] ?? STATUS_STYLES.PENDING,
                        )}
                      >
                        {(d.orders.statuses as Record<string, string>)[o.status]}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
