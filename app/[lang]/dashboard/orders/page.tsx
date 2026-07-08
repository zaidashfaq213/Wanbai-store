import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getOrders } from "@/lib/data/account";
import { getActiveBankAccounts } from "@/lib/data/payments";
import { formatCents, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { BagIcon } from "@/components/ui/icons";
import { OrderPaymentForm } from "@/components/dashboard/order-payment-form";
import { type BankOption } from "@/components/dashboard/bank-topup";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  DELIVERED: "bg-emerald-500/10 text-emerald-500",
  FAILED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-fuchsia-500/10 text-fuchsia-500",
  CANCELLED: "bg-muted/10 text-muted",
};

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const user = await requireUser(locale);
  const dict = await getDictionary(locale);
  const d = dict.dashboard.orders;
  const p = dict.payments;
  const currency = await getCurrency();
  const orders = await getOrders(user.id);
  const banksRaw = await getActiveBankAccounts();
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
  }));

  if (orders.length === 0) {
    return (
      <div>
        <PageHeader title={d.title} subtitle={d.subtitle} />
        <EmptyState
          message={d.empty}
          cta={dict.dashboard.overview.browse}
          href={`/${locale}/cards`}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <div className="grid gap-3 lg:grid-cols-2">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">{order.ref}</p>
              <p className="text-xs text-muted">
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
                {(dict.dashboard.orders.statuses as Record<string, string>)[order.status]}
              </span>
              <span className="font-black text-primary">
                {formatCents(order.total, currency.symbol, currency.rate, locale)}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {order.items.map((item) => (
              <div key={item.id} className="text-sm">
                <p className="font-semibold">
                  {item.productName} · {item.packageLabel}
                </p>
                {item.deliveredCode && (
                  <p className="mt-1 inline-block rounded-lg bg-surface-2 px-2 py-1 font-mono text-xs">
                    {d.code}: {item.deliveredCode}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Bank payment: submit proof, or show it's under review */}
          {order.status === "PENDING" &&
            (order.paymentSubmissions[0]?.status === "PENDING" ? (
              <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-500">
                {p.statuses.PENDING}
              </p>
            ) : (
              <OrderPaymentForm
                locale={locale}
                dict={p}
                banks={banks}
                orderRef={order.ref}
              />
            ))}
        </div>
      ))}
      </div>
    </div>
  );
}

function EmptyState({
  message,
  cta,
  href,
}: {
  message: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
        <BagIcon className="size-7" />
      </span>
      <p className="text-sm text-muted">{message}</p>
      <Link
        href={href}
        className="rounded-xl brand-gradient px-4 py-2.5 text-sm font-bold text-white"
      >
        {cta}
      </Link>
    </div>
  );
}
