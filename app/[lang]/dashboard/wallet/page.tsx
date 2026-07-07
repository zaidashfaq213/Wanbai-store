import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getWalletSummary } from "@/lib/data/account";
import { formatCents, cn } from "@/lib/utils";
import { WalletTopUp } from "@/components/dashboard/wallet-topup";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const user = await requireUser(locale);
  const dict = await getDictionary(locale);
  const d = dict.dashboard.wallet;
  const currency = await getCurrency();
  const { balance, transactions } = await getWalletSummary(user.id);

  return (
    <div>
      <PageHeader title={d.balance} subtitle={d.subtitle} />

      <div className="relative overflow-hidden rounded-3xl brand-gradient p-6 text-white shadow-[var(--shadow-card)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(24rem 24rem at 90% -20%, rgba(255,255,255,.35), transparent 60%)",
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <p className="text-sm font-semibold opacity-90">{d.balance}</p>
          <CurrencySelector current={currency.code} />
        </div>
        <p className="relative mt-2 text-4xl font-black">
          {formatCents(balance, currency.symbol, currency.rate, locale)}
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <WalletTopUp locale={locale} dict={d} />

        <div>
          <h3 className="mb-2 font-extrabold">{d.history}</h3>
          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
              {d.empty}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
            {transactions.map((t) => {
              const credit = t.amount >= 0;
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {(d.types as Record<string, string>)[t.type]}
                    </p>
                    <p className="text-xs text-muted">
                      {t.description ??
                        new Date(t.createdAt).toLocaleDateString(
                          locale === "ar" ? "ar-EG" : "en-US",
                        )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-black",
                      credit ? "text-emerald-500" : "text-red-500",
                    )}
                  >
                    {credit ? "+" : "−"}
                    {formatCents(
                      Math.abs(t.amount),
                      currency.symbol,
                      currency.rate,
                      locale,
                    )}
                  </span>
                </li>
              );
            })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
