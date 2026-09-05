import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminGsmServices, getAdminGsmCategories } from "@/lib/data/gsm";
import { formatUsd, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function AdminGsmServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const s = dict.admin.gsm.services;
  const [services, categories] = await Promise.all([getAdminGsmServices(), getAdminGsmCategories()]);

  if (categories.length === 0) {
    return (
      <div>
        <PageHeader title={s.title} subtitle={s.subtitle} />
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-bold">{s.noCategoriesTitle}</p>
          <p className="mt-1 text-sm text-muted">{s.noCategoriesBody}</p>
          <Link
            href={`/${locale}/admin/gsm/categories`}
            className="mt-4 inline-block rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white"
          >
            {s.noCategoriesCta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={s.title}
        subtitle={s.subtitle}
        action={
          <Link
            href={`/${locale}/admin/gsm/services/new`}
            className="rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white"
          >
            {s.add}
          </Link>
        }
      />

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {s.none}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3 text-start">{s.name}</th>
                <th className="p-3 text-start">{s.category}</th>
                <th className="p-3 text-start">{s.price}</th>
                <th className="p-3 text-start">{s.status}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <p className="font-bold">{locale === "ar" ? svc.nameAr : svc.nameEn}</p>
                    <p className="text-xs text-muted">{svc.slug}</p>
                  </td>
                  <td className="p-3 text-muted">
                    {locale === "ar" ? svc.category.nameAr : svc.category.nameEn}
                  </td>
                  <td className="p-3 font-semibold">
                    {formatUsd(svc.price, locale)}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        svc.active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted/10 text-muted",
                      )}
                    >
                      {svc.active ? s.active : s.inactive}
                    </span>
                  </td>
                  <td className="p-3 text-end">
                    <Link
                      href={`/${locale}/admin/gsm/services/${svc.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-surface-2"
                    >
                      {s.edit}
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
