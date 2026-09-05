import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getGsmOrderDetail } from "@/lib/data/gsm";
import { formatCents } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { GsmOrderDetailView } from "@/components/dashboard/gsm-order-detail-view";

export default async function GsmOrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; ref: string }>;
}) {
  const { lang, ref } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict, currency] = await Promise.all([requireUser(locale), getDictionary(locale), getCurrency()]);
  const d = dict.dashboard.gsmOrders;
  const order = await getGsmOrderDetail(ref, user.id);
  if (!order) notFound();

  const fieldsByKey = new Map(order.service.fields.map((f) => [f.key, f]));
  const inputs = (order.inputs as Record<string, string> | null) ?? {};
  const fieldAnswers = Object.entries(inputs).map(([key, value]) => {
    const field = fieldsByKey.get(key);
    const label = field ? (locale === "ar" ? field.labelAr : field.labelEn) : key;
    return { label, value };
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={order.ref}
        subtitle={d.subtitle}
        action={
          <Link href={`/${locale}/dashboard/gsm-orders`} className="text-sm font-bold text-muted hover:text-foreground">
            {d.back}
          </Link>
        }
      />
      <GsmOrderDetailView
        locale={locale}
        dict={d}
        order={{
          ref: order.ref,
          status: order.status,
          serviceName: order.serviceName,
          price: formatCents(order.price, currency.symbol, currency.rate, locale),
          createdAt: new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US"),
          fieldAnswers,
          files: order.files.map((f) => ({ id: f.id, filename: f.filename, data: f.data, source: f.source })),
          notes: order.notes.map((n) => ({
            id: n.id,
            body: n.body,
            isStaff: n.isStaff,
            createdAt: new Date(n.createdAt).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US"),
          })),
        }}
      />
    </div>
  );
}
