import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getApiProviderByKey, getProviderGames } from "@/lib/data/api-providers";
import { getAdminProducts, getAdminCategories } from "@/lib/data/catalog-db";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProviderBrowseConfigForm } from "@/components/admin/provider-browse-config-form";
import { ProviderGamesBrowser } from "@/components/admin/provider-games-browser";

export default async function AdminApiProviderBrowsePage({
  params,
}: {
  params: Promise<{ lang: string; key: string }>;
}) {
  const { lang, key } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.apiProviders;

  const provider = await getApiProviderByKey(key);
  if (!provider) notFound();

  const [games, products, categories] = await Promise.all([
    getProviderGames(provider.id),
    getAdminProducts(),
    getAdminCategories(),
  ]);

  return (
    <div>
      <Link
        href={`/${locale}/admin/api-providers`}
        className="mb-3 inline-block text-sm font-semibold text-muted hover:text-primary"
      >
        ← {d.back}
      </Link>
      <PageHeader title={`${d.browseTitle} — ${provider.name}`} subtitle={d.browseSubtitle} />

      <div className="flex flex-col gap-5">
        <ProviderBrowseConfigForm
          locale={locale}
          dict={d}
          providerId={provider.id}
          providerKey={provider.key}
          config={{
            listEndpoint: provider.listEndpoint,
            listMethod: provider.listMethod,
            itemsPath: provider.itemsPath,
            itemIdField: provider.itemIdField,
            itemNameField: provider.itemNameField,
            itemImageField: provider.itemImageField,
            catalogueEndpoint: provider.catalogueEndpoint,
            catalogueMethod: provider.catalogueMethod,
            catalogueItemsPath: provider.catalogueItemsPath,
            catalogueIdField: provider.catalogueIdField,
            catalogueNameField: provider.catalogueNameField,
            catalogueAmountField: provider.catalogueAmountField,
          }}
        />

        {!provider.listEndpoint ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            {d.notConfiguredYet}
          </div>
        ) : (
          <ProviderGamesBrowser
            locale={locale}
            dict={d}
            gameApiDict={dict.admin.gameapi}
            providerId={provider.id}
            providerKey={provider.key}
            games={games.map((g) => ({
              id: g.id,
              code: g.code,
              nameEn: g.nameEn,
              imageUrl: g.imageUrl,
              active: g.active,
              catalogueCount: g._count.catalogues,
              product: g.product
                ? { id: g.product.id, name: locale === "ar" ? g.product.nameAr : g.product.nameEn }
                : null,
            }))}
            products={products.map((p) => ({
              id: p.id,
              name: locale === "ar" ? p.nameAr : p.nameEn,
            }))}
            categories={categories.map((c) => ({
              id: c.id,
              name: locale === "ar" ? c.nameAr : c.nameEn,
            }))}
          />
        )}
      </div>
    </div>
  );
}
