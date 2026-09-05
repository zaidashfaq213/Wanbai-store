import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminProduct, getAdminCategories } from "@/lib/data/catalog-db";
import { inputsForProduct } from "@/lib/data/catalog-generate";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { PackageEditor, type PkgGroup } from "@/components/admin/package-editor";
import { ProductInputsEditor, type ProductInputRow } from "@/components/admin/product-inputs-editor";

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

  // The admin editor needs to show BOTH the automatic per-category fields
  // (Player ID, Server, etc. — which have no ProductInput row of their own)
  // and any custom overrides, so an admin can actually see and hide a field
  // that's purely automatic — not just the ones they created themselves.
  const auto = inputsForProduct(product.slug, product.category.slug);
  const customByKey = new Map(product.inputs.map((i) => [i.key, i]));
  const inputRows: ProductInputRow[] = [
    ...auto
      .filter((f) => !customByKey.has(f.id))
      .map((f) => ({
        id: null,
        key: f.id,
        labelEn: f.label.en,
        labelAr: f.label.ar,
        placeholderEn: f.placeholder.en,
        placeholderAr: f.placeholder.ar,
        kind: f.kind === "number" ? "number" : "text",
        required: f.required ?? false,
        hidden: false,
        isAuto: true,
      })),
    ...product.inputs.map((i) => ({
      id: i.id,
      key: i.key,
      labelEn: i.labelEn,
      labelAr: i.labelAr,
      placeholderEn: i.placeholderEn,
      placeholderAr: i.placeholderAr,
      kind: i.kind,
      required: i.required,
      hidden: i.hidden,
      isAuto: auto.some((f) => f.id === i.key),
    })),
  ];

  const groups: PkgGroup[] = product.variantGroups.map((g) => ({
    id: g.id,
    nameEn: g.nameEn,
    nameAr: g.nameAr,
    packages: g.packages.map((pk) => ({
      id: pk.id,
      labelEn: pk.labelEn,
      labelAr: pk.labelAr,
      priceUsd: pk.price / 100,
      compareAtPriceUsd: pk.compareAtPrice != null ? pk.compareAtPrice / 100 : null,
      compareAtEnabled: pk.compareAtEnabled,
      popular: pk.popular,
      available: pk.available,
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
          confirm={dict.admin.confirm}
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
            available: product.available,
          }}
          categories={categories.map((c) => ({
            id: c.id,
            label: locale === "ar" ? c.nameAr : c.nameEn,
          }))}
        />
        <PackageEditor locale={locale} dict={p} confirm={dict.admin.confirm} productId={product.id} groups={groups} />
        <ProductInputsEditor
          locale={locale}
          dict={p.inputs}
          errors={dict.admin.catalog.errors}
          confirm={dict.admin.confirm}
          productId={product.id}
          rows={inputRows}
        />
      </div>
    </div>
  );
}
