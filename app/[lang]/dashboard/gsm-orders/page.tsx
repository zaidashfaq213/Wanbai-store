import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getGsmOrders } from "@/lib/data/gsm";
import { formatUsd, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { PhoneIcon } from "@/components/ui/icons";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  UNDER_REVIEW: "bg-violet-500/10 text-violet-500",
  IN_PROGRESS: "bg-primary/10 text-primary",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
  CANCELLED: "bg-muted/10 text-muted",
};

export default async function GsmOrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict] = await Promise.all([requireUser(locale), getDictionary(locale)]);
  const d = dict.dashboard.gsmOrders;
  const orders = await getGsmOrders(user.id);

  if (orders.length === 0) {
    return (
      <div>
        <PageHeader title={d.title} subtitle={d.subtitle} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
            <PhoneIcon className="size-7" />
          </span>
          <p className="text-sm text-muted">{d.none}</p>
          <Link href={`/${locale}/gsm`} className="rounded-xl brand-gradient px-4 py-2.5 text-sm font-bold text-white">
            {d.browse}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <div className="grid gap-3 lg:grid-cols-2">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/${locale}/dashboard/gsm-orders/${order.ref}`}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">{order.ref}</p>
                <p className="text-xs text-muted">
                  {new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", STATUS_STYLES[order.status])}>
                  {d.statusLabels[order.status]}
                </span>
                <span className="font-black text-primary">
                  {formatUsd(order.price, locale)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-1 flex-col gap-1 border-t border-border pt-3 text-sm">
              <p className="font-semibold">{order.serviceName}</p>
            </div>
            <span className="ms-auto mt-2 text-sm font-bold text-primary group-hover:underline">
              {d.view} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
