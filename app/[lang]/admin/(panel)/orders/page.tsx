import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireStaff } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAllOrders, getUnreadOrderMessages } from "@/lib/data/payments";
import { fulfillOrder, updateOrderStatus, refundOrder } from "@/lib/actions/payments";
import { ConfirmButton } from "@/components/ui/confirm-button";
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
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { lang } = await params;
  const { status } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireStaff(locale);
  const dict = await getDictionary(locale);
  const o = dict.admin.orders;
  const statuses = o.statuses as Record<string, string>;
  const currency = await getCurrency();
  const filter = (STATUSES as readonly string[]).includes(status ?? "")
    ? (status as (typeof STATUSES)[number])
    : undefined;
  const [orders, unread] = await Promise.all([
    getAllOrders(filter),
    getUnreadOrderMessages(),
  ]);

  return (
    <div>
      <PageHeader title={o.title} subtitle={o.subtitle} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/admin/orders`}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            !filter ? "bg-primary/10 text-primary" : "border border-border hover:bg-surface-2",
          )}
        >
          {o.all}
        </Link>
        {STATUSES.map((st) => (
          <Link
            key={st}
            href={`/${locale}/admin/orders?status=${st}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              filter === st ? "bg-primary/10 text-primary" : "border border-border hover:bg-surface-2",
            )}
          >
            {statuses[st]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {o.none}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const item = order.items[0];
            const unreadCount = unread.get(order.id) ?? 0;
            return (
              <div key={order.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-bold">
                      {order.ref}
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                          {o.unread}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {order.user?.name ?? order.email} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString(
                        locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
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
                    <Link
                      href={`/${locale}/admin/orders/${order.ref}`}
                      className="rounded-xl brand-gradient px-3 py-1.5 text-xs font-bold text-white"
                    >
                      {o.view}
                    </Link>
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
                  <div className="mt-2">
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
