import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getReEngagementSettings } from "@/lib/data/content";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReEngagementForm, type ReEngagementRow } from "@/components/admin/content-forms";

export default async function AdminReEngagementPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale); // Supervisor only
  const dict = await getDictionary(locale);
  const d = dict.admin.reengagement;
  const settings = await getReEngagementSettings();

  const row: ReEngagementRow = {
    enabled: settings.enabled,
    inactiveDays: settings.inactiveDays,
    maxSends: settings.maxSends,
    intervalDays: settings.intervalDays,
    subjectEn: settings.subjectEn,
    subjectAr: settings.subjectAr,
    bodyEn: settings.bodyEn,
    bodyAr: settings.bodyAr,
  };

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <ReEngagementForm dict={d} errors={dict.admin.content.errors} settings={row} />
    </div>
  );
}
