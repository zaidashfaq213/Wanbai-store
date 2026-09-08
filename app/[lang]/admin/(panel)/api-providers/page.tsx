import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAllApiProviders } from "@/lib/data/api-providers";
import { SITE_URL } from "@/lib/seo";
import { PageHeader } from "@/components/dashboard/page-header";
import { ApiProviderCard, type ApiProviderRow } from "@/components/admin/api-provider-card";
import { ApiProviderCreateForm } from "@/components/admin/api-provider-create-form";

export default async function AdminApiProvidersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.apiProviders;
  const providers = await getAllApiProviders();

  const rows: ApiProviderRow[] = providers.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    baseUrl: p.baseUrl,
    hasApiKey: Boolean(p.apiKey),
    authMethod: p.authMethod,
    authHeaderName: p.authHeaderName,
    testPath: p.testPath,
    webhookSecret: p.webhookSecret,
    active: p.active,
    notes: p.notes,
    connectedGames: p._count.games,
    lastTestedAt: p.lastTestedAt ? p.lastTestedAt.toISOString() : null,
    lastTestOk: p.lastTestOk,
    lastTestMessage: p.lastTestMessage,
    lastErrorAt: p.lastErrorAt ? p.lastErrorAt.toISOString() : null,
    lastErrorMessage: p.lastErrorMessage,
  }));

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <div className="flex flex-col gap-4">
        {rows.map((p) => (
          <ApiProviderCard
            key={p.id}
            locale={locale}
            dict={d}
            confirm={dict.admin.confirm}
            webhookBaseUrl={`${SITE_URL}/api/webhook`}
            provider={p}
          />
        ))}
        <ApiProviderCreateForm locale={locale} dict={d} />
      </div>
    </div>
  );
}
