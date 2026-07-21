import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminCategories } from "@/lib/data/catalog-db";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryForm, type CategoryRow } from "@/components/admin/category-form";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const c = dict.admin.catalog.categories;
  const rows = await getAdminCategories();

  const categories: CategoryRow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    nameEn: r.nameEn,
    nameAr: r.nameAr,
    icon: r.icon,
    gradient: r.gradient,
    sortOrder: r.sortOrder,
    active: r.active,
    productsCount: r._count.products,
  }));

  return (
    <div>
      <PageHeader title={c.title} subtitle={c.subtitle} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryForm locale={locale} dict={c} confirm={dict.admin.confirm} errors={dict.admin.catalog.errors} />
        {categories.map((cat) => (
          <CategoryForm
            key={cat.id}
            locale={locale}
            dict={c}
            confirm={dict.admin.confirm}
            errors={dict.admin.catalog.errors}
            category={cat}
          />
        ))}
      </div>
    </div>
  );
}
