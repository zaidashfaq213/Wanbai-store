import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireStaff } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAdminGsmOrders } from "@/lib/data/gsm";
import { formatCents, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  UNDER_REVIEW: "bg-violet-500/10 text-violet-500",
  IN_PROGRESS: "bg-primary/10 text-primary",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
  CANCELLED: "bg-muted/10 text-muted",
};

const STATUSES = ["PENDING", "PAID", "UNDER_REVIEW", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"] as const;

export default async function AdminGsmOrdersPage({
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
  const o = dict.admin.gsm.orders;
  const currency = await getCurrency();
  const filter = (STATUSES as readonly string[]).includes(status ?? "")
    ? (status as (typeof STATUSES)[number])
    : undefined;
  const allOrders = await getAdminGsmOrders();
  const orders = filter ? allOrders.filter((ord) => ord.status === filter) : allOrders;

  return (
    <div>
      <PageHeader title={o.title} subtitle={o.subtitle} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/admin/gsm/orders`}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            !filter ? "bg-primary/10 text-primary" : "border border-border hover:bg-surface-2",
          )}
        >
          {dict.admin.orders.all}
        </Link>
        {STATUSES.map((st) => (
          <Link
            key={st}
            href={`/${locale}/admin/gsm/orders?status=${st}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              filter === st ? "bg-primary/10 text-primary" : "border border-border hover:bg-surface-2",
            )}
          >
            {o.statusLabels[st]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {o.none}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3 text-start">{o.ref}</th>
                <th className="p-3 text-start">{o.customer}</th>
                <th className="p-3 text-start">{o.service}</th>
                <th className="p-3 text-start">{o.price}</th>
                <th className="p-3 text-start">{o.status}</th>
                <th className="p-3 text-start">{o.date}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-bold">{order.ref}</td>
                  <td className="p-3 text-muted">{order.user?.name ?? order.email}</td>
                  <td className="p-3">{order.serviceName}</td>
                  <td className="p-3 font-semibold">{formatCents(order.price, currency.symbol, currency.rate, locale)}</td>
                  <td className="p-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", STATUS_STYLES[order.status])}>
                      {o.statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="p-3 text-muted">
                    {new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}
                  </td>
                  <td className="p-3 text-end">
                    <Link
                      href={`/${locale}/admin/gsm/orders/${order.id}`}
                      className="rounded-xl brand-gradient px-3 py-1.5 text-xs font-bold text-white"
                    >
                      {o.view}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
