import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getWalletSummary } from "@/lib/data/account";
import { getActiveBankAccounts, getUserSubmissions } from "@/lib/data/payments";
import { formatCents, cn } from "@/lib/utils";
import { BankTopUp, type BankOption } from "@/components/dashboard/bank-topup";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { PageHeader } from "@/components/dashboard/page-header";

const SUB_STATUS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  APPROVED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
};

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
  const p = dict.payments;
  const currency = await getCurrency();

  const [{ balance, transactions }, banksRaw, submissions] = await Promise.all([
    getWalletSummary(user.id),
    getActiveBankAccounts(),
    getUserSubmissions(user.id),
  ]);

  const banks: BankOption[] = banksRaw.map((b) => ({
    id: b.id,
    key: b.key,
    nameEn: b.nameEn,
    nameAr: b.nameAr,
    accountName: b.accountName,
    accountNumber: b.accountNumber,
    instructionsEn: b.instructionsEn,
    instructionsAr: b.instructionsAr,
    color: b.color,
    logo: b.logo,
  }));

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

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* Top-up via bank transfer */}
        <div>
          <h3 className="mb-2 font-extrabold">{p.topUpTitle}</h3>
          <BankTopUp locale={locale} dict={p} banks={banks} />
        </div>

        {/* Submissions + history */}
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="mb-2 font-extrabold">{p.yourSubmissions}</h3>
            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
                {p.noSubmissions}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {submissions.slice(0, 6).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold">
                        {formatCents(s.amount, currency.symbol, currency.rate, locale)}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {locale === "ar" ? s.bankAccount.nameAr : s.bankAccount.nameEn}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                        SUB_STATUS[s.status],
                      )}
                    >
                      {(p.statuses as Record<string, string>)[s.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-extrabold">{d.history}</h3>
            {transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
                {d.empty}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {transactions.map((t) => {
                  const credit = t.amount >= 0;
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3"
                    >
                      <span className="text-sm font-semibold">
                        {(d.types as Record<string, string>)[t.type] ?? t.type}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-black",
                          credit ? "text-emerald-500" : "text-red-500",
                        )}
                      >
                        {credit ? "+" : "−"}
                        {formatCents(Math.abs(t.amount), currency.symbol, currency.rate, locale)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
