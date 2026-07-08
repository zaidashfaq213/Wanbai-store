import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAllOrders } from "@/lib/data/payments";
import { fulfillOrder, updateOrderStatus, refundOrder } from "@/lib/actions/payments";
import { formatCents, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  DELIVERED: "bg-emerald-500/10 text-emerald-500",
  FAILED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-fuchsia-500/10 text-fuchsia-500",
  CANCELLED: "bg-muted/10 text-muted",
};

const STATUSES = ["PENDING", "PAID", "DELIVERED", "FAILED", "REFUNDED", "CANCELLED"] as const;

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const o = dict.admin.orders;
  const statuses = o.statuses as Record<string, string>;
  const currency = await getCurrency();
  const orders = await getAllOrders();

  return (
    <div>
      <PageHeader title={o.title} subtitle={o.subtitle} />

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {o.none}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const item = order.items[0];
            return (
              <div key={order.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{order.ref}</p>
                    <p className="text-xs text-muted">
                      {order.user?.name ?? order.email} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString(
                        locale === "ar" ? "ar-EG" : "en-US",
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING,
                      )}
                    >
                      {statuses[order.status]}
                    </span>
                    <span className="font-black text-primary">
                      {formatCents(order.total, currency.symbol, currency.rate, locale)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 border-t border-border pt-2 text-sm">
                  {order.items.map((it) => (
                    <p key={it.id} className="font-semibold">
                      {it.productName} · {it.packageLabel}
                      {it.inputs ? (
                        <span className="text-muted"> · {JSON.stringify(it.inputs)}</span>
                      ) : null}
                    </p>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {/* Fulfil: enter delivered code */}
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

                  {/* Status update */}
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
                  <form action={refundOrder} className="mt-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-fuchsia-500 transition-colors hover:bg-fuchsia-500/10"
                    >
                      {o.refund}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
