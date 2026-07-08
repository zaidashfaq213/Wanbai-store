import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminProduct, getAdminCategories } from "@/lib/data/catalog-db";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { PackageEditor, type PkgGroup } from "@/components/admin/package-editor";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const p = dict.admin.catalog.products;

  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
  ]);
  if (!product) notFound();

  const groups: PkgGroup[] = product.variantGroups.map((g) => ({
    id: g.id,
    nameEn: g.nameEn,
    nameAr: g.nameAr,
    packages: g.packages.map((pk) => ({
      id: pk.id,
      labelEn: pk.labelEn,
      labelAr: pk.labelAr,
      priceUsd: pk.price / 100,
      popular: pk.popular,
    })),
  }));

  return (
    <div>
      <Link href={`/${locale}/admin/products`} className="mb-3 inline-block text-sm font-semibold text-muted hover:text-primary">
        {p.back}
      </Link>
      <PageHeader
        title={locale === "ar" ? product.nameAr : product.nameEn}
        subtitle={product.slug}
      />
      <div className="flex flex-col gap-5">
        <ProductEditForm
          locale={locale}
          dict={p}
          errors={dict.admin.catalog.errors}
          fulfillments={dict.admin.catalog.fulfillments as Record<string, string>}
          product={{
            id: product.id,
            slug: product.slug,
            categoryId: product.categoryId,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            badgeEn: product.badgeEn,
            badgeAr: product.badgeAr,
            initial: product.initial,
            priceFromUsd: product.priceFrom / 100,
            image: product.image,
            fulfillment: product.fulfillment,
            overviewEn: product.overviewEn,
            overviewAr: product.overviewAr,
            howToUseEn: product.howToUseEn,
            howToUseAr: product.howToUseAr,
            active: product.active,
          }}
          categories={categories.map((c) => ({
            id: c.id,
            label: locale === "ar" ? c.nameAr : c.nameEn,
          }))}
        />
        <PackageEditor locale={locale} dict={p} productId={product.id} groups={groups} />
      </div>
    </div>
  );
}
