import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireStaff } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAdminOrderDetail } from "@/lib/data/payments";
import { fulfillOrder, updateOrderStatus, refundOrder } from "@/lib/actions/payments";
import { formatCents, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrderChat } from "@/components/order/order-chat";
import { ConfirmButton } from "@/components/ui/confirm-button";

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

const STATUSES = ["PENDING", "PAID", "DELIVERED", "FAILED", "REFUNDED", "CANCELLED"] as const;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; ref: string }>;
}) {
  const { lang, ref } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireStaff(locale);
  const dict = await getDictionary(locale);
  const o = dict.admin.orders;
  const statuses = o.statuses as Record<string, string>;
  const methods = o.methods as Record<string, string>;
  const proofStatuses = dict.payments.statuses as Record<string, string>;
  const currency = await getCurrency();

  const order = await getAdminOrderDetail(ref);
  if (!order) notFound();

  const money = (cents: number) =>
    formatCents(cents, currency.symbol, currency.rate, locale);
  const item = order.items[0];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/${locale}/admin/orders`}
        className="mb-3 inline-block text-sm font-semibold text-muted hover:text-primary"
      >
        ← {o.back}
      </Link>

      <PageHeader
        title={order.ref}
        subtitle={`${o.placedOn}: ${new Date(order.createdAt).toLocaleString(
          locale === "ar" ? "ar-EG" : "en-US",
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
        {/* Customer */}
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-3 text-base font-black">{o.customerInfo}</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Line label={dict.admin.users.name} value={order.user?.name ?? "—"} />
            <Line label={dict.admin.users.contact} value={order.email} />
            <Line
              label={o.walletBalance}
              value={order.user ? money(order.user.walletBalance) : "—"}
            />
            <Line
              label={o.paymentMethod}
              value={methods[order.paymentMethod] ?? order.paymentMethod}
            />
          </dl>
        </section>

        {/* Items */}
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-3 text-base font-black">{o.details}</h2>
          <ul className="flex flex-col gap-3">
            {order.items.map((it) => {
              const inputs = (it.inputs ?? null) as Record<string, string> | null;
              return (
                <li
                  key={it.id}
                  className="rounded-xl border border-border bg-surface-2 p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{it.productName}</p>
                      <p className="text-xs text-muted">
                        {it.variantLabel ? `${it.variantLabel} · ` : ""}
                        {it.packageLabel} × {it.quantity} · {it.deliveryType}
                      </p>
                    </div>
                    <span className="font-black text-primary">
                      {money(it.unitPrice * it.quantity)}
                    </span>
                  </div>

                  {inputs && Object.keys(inputs).length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-1 text-xs font-bold text-muted">{o.inputs}</p>
                      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        {Object.entries(inputs).map(([key, value]) => (
                          <div key={key} className="flex gap-1.5">
                            <dt className="text-muted">{key}:</dt>
                            <dd className="font-semibold select-all">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {it.deliveredCode && (
                    <p className="mt-3 inline-block rounded-lg bg-surface px-2.5 py-1.5 font-mono text-sm font-bold">
                      {it.deliveredCode}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-4 flex justify-between border-t border-border pt-4 text-base">
            <span className="font-bold">{o.total}</span>
            <span className="font-black text-primary">{money(order.total)}</span>
          </p>
        </section>

        {/* Fulfilment controls */}
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-3 text-base font-black">{o.fulfil}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <form action={fulfillOrder} className="flex items-end gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="locale" value={locale} />
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-semibold text-muted">{o.code}</span>
                <input
                  name="code"
                  defaultValue={item?.deliveredCode ?? ""}
                  placeholder={o.codePlaceholder}
                  className="h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-xl bg-emerald-500 px-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
              >
                {o.deliver}
              </button>
            </form>

            <form action={updateOrderStatus} className="flex items-end gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="locale" value={locale} />
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-semibold text-muted">{o.status}</span>
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {statuses[st]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="h-10 rounded-xl border border-border px-3 text-sm font-bold transition-colors hover:bg-surface-2"
              >
                {o.update}
              </button>
            </form>
          </div>

          {(order.status === "PAID" || order.status === "DELIVERED") && (
            <div className="mt-3">
              <ConfirmButton
                action={refundOrder}
                hidden={{ orderId: order.id, locale }}
                title={dict.admin.confirm.refundTitle}
                body={dict.admin.confirm.refundBody}
                confirmText={dict.admin.confirm.yes}
                cancelText={dict.admin.confirm.no}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-fuchsia-500 transition-colors hover:bg-fuchsia-500/10"
              >
                {o.refund}
              </ConfirmButton>
            </div>
          )}
        </section>

        {/* Payment proofs */}
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-3 text-base font-black">{o.proofs}</h2>
          {order.paymentSubmissions.length === 0 ? (
            <p className="text-sm text-muted">{o.noProofs}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {order.paymentSubmissions.map((s) => (
                <li key={s.id} className="rounded-xl border border-border bg-surface-2 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">
                        {locale === "ar" ? s.bankAccount.nameAr : s.bankAccount.nameEn}
                      </p>
                      <p className="text-xs text-muted">
                        {s.senderName ?? "—"}
                        {s.reference ? ` · ${s.reference}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        PROOF_STYLES[s.status],
                      )}
                    >
                      {proofStatuses[s.status]}
                    </span>
                  </div>
                  {/* Proofs are base64 data URLs, so a plain <img> is correct here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.proofUrl}
                    alt={s.reference ?? s.id}
                    className="h-40 w-full rounded-lg object-cover"
                  />
                  <a
                    href={s.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-bold text-primary hover:underline"
                  >
                    {o.viewProof}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/${locale}/admin/payments?status=PENDING&type=ORDER`}
            className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
          >
            {dict.admin.payments.title} →
          </Link>
        </section>

        {/* Chat with the customer */}
        <OrderChat
          locale={locale}
          orderRef={order.ref}
          variant="admin"
          messages={order.messages}
          labels={o.chat}
        />
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
