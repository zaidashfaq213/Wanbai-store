import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminCategories } from "@/lib/data/catalog-db";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductCreateForm } from "@/components/admin/product-create-form";

export default async function AdminNewProductPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const p = dict.admin.catalog.products;
  const categories = await getAdminCategories();

  return (
    <div>
      <Link href={`/${locale}/admin/products`} className="mb-3 inline-block text-sm font-semibold text-muted hover:text-primary">
        {p.back}
      </Link>
      <PageHeader title={p.newProduct} subtitle={p.subtitle} />

      {categories.length === 0 ? (
        // A product always belongs to a category — with none created yet, the
        // category <select> below would be empty and the browser blocks
        // submission with a native "select an item" prompt that looks like a
        // broken/unexplained error. Guide the admin to fix the real cause.
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-base font-bold">{p.noCategoriesTitle}</p>
          <p className="max-w-sm text-sm text-muted">{p.noCategoriesBody}</p>
          <Link
            href={`/${locale}/admin/categories`}
            className="rounded-xl brand-gradient px-5 py-2.5 text-sm font-bold text-white"
          >
            {p.noCategoriesCta}
          </Link>
        </div>
      ) : (
        <ProductCreateForm
          locale={locale}
          dict={p}
          errors={dict.admin.catalog.errors}
          categories={categories.map((c) => ({
            id: c.id,
            label: locale === "ar" ? c.nameAr : c.nameEn,
          }))}
        />
      )}
    </div>
  );
}
