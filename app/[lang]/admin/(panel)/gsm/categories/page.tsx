import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminGsmCategories } from "@/lib/data/gsm";
import { PageHeader } from "@/components/dashboard/page-header";
import { GsmCategoryForm, type GsmCategoryRow } from "@/components/admin/gsm-category-form";

export default async function AdminGsmCategoriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const c = dict.admin.gsm.categories;
  const rows = await getAdminGsmCategories();

  const categories: GsmCategoryRow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    nameEn: r.nameEn,
    nameAr: r.nameAr,
    icon: r.icon,
    sortOrder: r.sortOrder,
    active: r.active,
    servicesCount: r._count.services,
  }));

  return (
    <div>
      <PageHeader title={c.title} subtitle={c.subtitle} />
      <div className="grid gap-4 lg:grid-cols-2">
        <GsmCategoryForm locale={locale} dict={c} confirm={dict.admin.confirm} errors={dict.admin.gsm.errors} />
        {categories.map((cat) => (
          <GsmCategoryForm
            key={cat.id}
            locale={locale}
            dict={c}
            confirm={dict.admin.confirm}
            errors={dict.admin.gsm.errors}
            category={cat}
          />
        ))}
      </div>
    </div>
  );
}
