import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAdminProducts } from "@/lib/data/catalog-db";
import { formatCents, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const p = dict.admin.catalog.products;
  const currency = await getCurrency();
  const products = await getAdminProducts();

  return (
    <div>
      <PageHeader
        title={p.title}
        subtitle={p.subtitle}
        action={
          <Link
            href={`/${locale}/admin/products/new`}
            className="rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white"
          >
            {p.add}
          </Link>
        }
      />

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {p.none}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3 text-start">{p.name}</th>
                <th className="p-3 text-start">{p.category}</th>
                <th className="p-3 text-start">{p.priceFrom}</th>
                <th className="p-3 text-start">{p.status}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <p className="font-bold">{locale === "ar" ? prod.nameAr : prod.nameEn}</p>
                    <p className="text-xs text-muted">{prod.slug}</p>
                  </td>
                  <td className="p-3 text-muted">
                    {locale === "ar" ? prod.category.nameAr : prod.category.nameEn}
                  </td>
                  <td className="p-3 font-semibold">
                    {formatCents(prod.priceFrom, currency.symbol, currency.rate, locale)}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        prod.active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted/10 text-muted",
                      )}
                    >
                      {prod.active ? p.active : p.inactive}
                    </span>
                  </td>
                  <td className="p-3 text-end">
                    <Link
                      href={`/${locale}/admin/products/${prod.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-surface-2"
                    >
                      {p.edit}
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
