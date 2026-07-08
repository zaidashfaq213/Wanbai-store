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
      <ProductCreateForm
        locale={locale}
        dict={p}
        errors={dict.admin.catalog.errors}
        categories={categories.map((c) => ({
          id: c.id,
          label: locale === "ar" ? c.nameAr : c.nameEn,
        }))}
      />
    </div>
  );
}
