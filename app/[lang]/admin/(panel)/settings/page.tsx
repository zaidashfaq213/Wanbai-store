import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/data/content";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  SettingsForm,
  type SettingsRow,
  ApiSettingsForm,
  type ApiSettingsRow,
} from "@/components/admin/content-forms";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.content.settings;
  const settings = await getSettings();

  const apiSettings: ApiSettingsRow = {
    gameApiEnabled: settings.gameApiEnabled,
    gameApiBaseUrl: settings.gameApiBaseUrl,
    gameApiKey: settings.gameApiKey,
    // The secret itself is never sent to the client — only whether one is set.
    hasSecret: Boolean(settings.gameApiSecret),
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <SettingsForm
        locale={locale}
        dict={d}
        errors={dict.admin.content.errors}
        settings={settings as SettingsRow}
      />
      <ApiSettingsForm
        dict={dict.admin.content.apiSettings}
        errors={dict.admin.content.errors}
        settings={apiSettings}
      />
    </div>
  );
}
