import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getOrderDetail } from "@/lib/data/account";
import { getActiveBankAccounts } from "@/lib/data/payments";
import { formatCents, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrderPaymentForm } from "@/components/dashboard/order-payment-form";
import { type BankOption } from "@/components/dashboard/bank-topup";
import { OrderChat } from "@/components/order/order-chat";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  DELIVERED: "bg-emerald-500/10 text-emerald-500",
  FAILED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-fuchsia-500/10 text-fuchsia-500",
  CANCELLED: "bg-muted/10 text-muted",
};

const PROOF_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  APPROVED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; ref: string }>;
}) {
  const { lang, ref } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict, currency] = await Promise.all([
    requireUser(locale),
    getDictionary(locale),
    getCurrency(),
  ]);
  const d = dict.dashboard.orders;
  const p = dict.payments;
  const statuses = d.statuses as Record<string, string>;
  const methods = d.methods as Record<string, string>;
  const proofStatuses = p.statuses as Record<string, string>;

  const [order, banksRaw] = await Promise.all([
    getOrderDetail(ref, user.id),
    getActiveBankAccounts(),
  ]);
  if (!order) notFound();
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

  const money = (cents: number) =>
    formatCents(cents, currency.symbol, currency.rate, locale);
  const latestProof = order.paymentSubmissions[0];
  const awaitingProof =
    order.status === "PENDING" && latestProof?.status !== "PENDING";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${locale}/dashboard/orders`}
        className="mb-3 inline-block text-sm font-semibold text-muted hover:text-primary"
      >
        ← {d.back}
      </Link>

      <PageHeader
        title={order.ref}
        subtitle={`${d.placedOn}: ${new Date(order.createdAt).toLocaleString(
          locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
          { dateStyle: "medium", timeStyle: "short" },
        )}`}
        action={
          <span
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold",
              STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING,
            )}
          >
            {statuses[order.status]}
          </span>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Items + totals */}
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-3 text-base font-black">{d.details}</h2>

          <ul className="flex flex-col gap-3">
            {order.items.map((item) => {
              const inputs = (item.inputs ?? null) as Record<string, string> | null;
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-border bg-surface-2 p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{item.productName}</p>
                      <p className="text-xs text-muted">
                        {item.variantLabel ? `${item.variantLabel} · ` : ""}
                        {item.packageLabel} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-black text-primary">
                      {money(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  {inputs && Object.keys(inputs).length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-1 text-xs font-bold text-muted">{d.inputs}</p>
                      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        {Object.entries(inputs).map(([key, value]) => (
                          <div key={key} className="flex gap-1.5">
                            <dt className="text-muted">{key}:</dt>
                            <dd className="font-semibold">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {item.deliveredCode && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-1 text-xs font-bold text-muted">{d.code}</p>
                      <p className="inline-block rounded-lg bg-surface px-2.5 py-1.5 font-mono text-sm font-bold">
                        {item.deliveredCode}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <dl className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{d.paymentMethod}</dt>
              <dd className="font-semibold">
                {methods[order.paymentMethod] ?? order.paymentMethod}
              </dd>
            </div>
            <div className="flex justify-between text-base">
              <dt className="font-bold">{d.total}</dt>
              <dd className="font-black text-primary">{money(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* Payment proof history */}
        {order.paymentMethod === "BANK" && (
          <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="mb-3 text-base font-black">{d.proof}</h2>

            {order.paymentSubmissions.length === 0 ? (
              <p className="text-sm text-muted">{d.noProof}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {order.paymentSubmissions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 p-3"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        {locale === "ar" ? s.bankAccount.nameAr : s.bankAccount.nameEn}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(s.createdAt).toLocaleString(
                          locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
                          { dateStyle: "short", timeStyle: "short" },
                        )}
                        {s.reference ? ` · ${s.reference}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={s.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold hover:bg-surface"
                      >
                        {d.viewProof}
                      </a>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          PROOF_STYLES[s.status],
                        )}
                      >
                        {proofStatuses[s.status]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Still unpaid → let them (re)submit a screenshot right here */}
            {awaitingProof && (
              <div className="mt-4">
                <OrderPaymentForm
                  locale={locale}
                  dict={p}
                  banks={banks}
                  orderRef={order.ref}
                />
              </div>
            )}
          </section>
        )}

        {/* Chat with the admin about this order */}
        <OrderChat
          locale={locale}
          orderRef={order.ref}
          variant="user"
          messages={order.messages}
          labels={d.chat}
        />
      </div>
    </div>
  );
}
