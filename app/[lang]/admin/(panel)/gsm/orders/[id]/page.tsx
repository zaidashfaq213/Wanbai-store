import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireStaff } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAdminGsmOrderDetail } from "@/lib/data/gsm";
import { formatCents } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { GsmOrderDetail } from "@/components/admin/gsm-order-detail";

export default async function AdminGsmOrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireStaff(locale);
  const dict = await getDictionary(locale);
  const o = dict.admin.gsm.orders;
  const currency = await getCurrency();
  const order = await getAdminGsmOrderDetail(id);
  if (!order) notFound();

  const fieldsByKey = new Map(order.service.fields.map((f) => [f.key, f]));
  const inputs = (order.inputs as Record<string, string> | null) ?? {};
  const fieldAnswers = Object.entries(inputs).map(([key, value]) => {
    const field = fieldsByKey.get(key);
    const label = field ? (locale === "ar" ? field.labelAr : field.labelEn) : key;
    return { label, value };
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={order.ref}
        subtitle={o.subtitle}
        action={
          <Link href={`/${locale}/admin/gsm/orders`} className="text-sm font-bold text-muted hover:text-foreground">
            {o.back}
          </Link>
        }
      />
      <GsmOrderDetail
        locale={locale}
        dict={o}
        errors={dict.admin.gsm.errors}
        order={{
          id: order.id,
          ref: order.ref,
          status: order.status,
          serviceName: order.serviceName,
          categoryName: order.categoryName,
          price: formatCents(order.price, currency.symbol, currency.rate, locale),
          createdAt: new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US"),
          customer: order.user?.name ?? order.email,
          customerEmail: order.user?.email ?? order.email,
          fieldAnswers,
          customerFiles: order.files
            .filter((f) => f.source === "customer")
            .map((f) => ({ id: f.id, filename: f.filename, data: f.data })),
          resultFiles: order.files
            .filter((f) => f.source === "admin")
            .map((f) => ({ id: f.id, filename: f.filename, data: f.data })),
          notes: order.notes.map((n) => ({
            id: n.id,
            body: n.body,
            isStaff: n.isStaff,
            authorName: n.author?.name ?? null,
            createdAt: new Date(n.createdAt).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US"),
          })),
        }}
      />
    </div>
  );
}
