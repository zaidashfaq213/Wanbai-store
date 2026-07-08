import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminCounts, getSalesSummary } from "@/lib/data/payments";
import { getCurrency } from "@/lib/data/currency";
import { formatCents, cn } from "@/lib/utils";
import { WalletIcon, BagIcon, UserIcon, GridIcon } from "@/components/ui/icons";

export default async function AdminOverview({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const a = dict.admin;
  const currency = await getCurrency();
  const [[pendingPayments, activeOrders, users, totalOrders], sales] =
    await Promise.all([getAdminCounts(), getSalesSummary()]);

  const stats = [
    { Icon: WalletIcon, label: a.overview.pendingPayments, value: pendingPayments, href: `/${locale}/admin/payments`, tint: "text-amber-500 bg-amber-500/10", highlight: pendingPayments > 0 },
    { Icon: BagIcon, label: a.overview.activeOrders, value: activeOrders, href: `/${locale}/admin/orders`, tint: "text-sky-500 bg-sky-500/10" },
    { Icon: UserIcon, label: a.overview.users, value: users, href: `/${locale}/admin/users`, tint: "text-emerald-500 bg-emerald-500/10" },
    { Icon: GridIcon, label: a.overview.totalOrders, value: totalOrders, href: `/${locale}/admin/orders`, tint: "text-fuchsia-500 bg-fuchsia-500/10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">{a.title}</h2>
        <p className="mt-1 text-sm text-muted">{a.overview.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={cn(
              "rounded-2xl border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
              s.highlight ? "border-amber-500/40" : "border-border",
            )}
          >
            <span className={cn("grid size-10 place-items-center rounded-xl", s.tint)}>
              <s.Icon className="size-5" />
            </span>
            <p className="mt-3 text-2xl font-black">{s.value}</p>
            <p className="text-xs font-semibold text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {pendingPayments > 0 && (
        <Link
          href={`/${locale}/admin/payments`}
          className="flex items-center justify-center rounded-2xl brand-gradient px-4 py-3.5 text-sm font-bold text-white"
        >
          {a.overview.reviewPayments} ({pendingPayments})
        </Link>
      )}

      {/* Sales report */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl brand-gradient p-5 text-white shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold opacity-90">{a.overview.revenue}</p>
          <p className="mt-1 text-3xl font-black">
            {formatCents(sales.revenueCents, currency.symbol, currency.rate, locale)}
          </p>
          <p className="mt-1 text-xs opacity-80">
            {sales.paidOrders} {a.overview.activeOrders.toLowerCase()}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="mb-3 font-extrabold">{a.overview.topProducts}</h3>
          {sales.topItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">—</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {sales.topItems.map((t) => (
                <li key={t.slug} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-muted">
                    {t.count} {a.overview.sold} ·{" "}
                    <span className="font-bold text-primary">
                      {formatCents(t.revenueCents, currency.symbol, currency.rate, locale)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
