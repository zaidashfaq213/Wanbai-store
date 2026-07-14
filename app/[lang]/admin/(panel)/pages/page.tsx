import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminPages } from "@/lib/data/content";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageForm, type PageRow } from "@/components/admin/content-forms";

export default async function AdminPagesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.content.pages;
  const rows = await getAdminPages();

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <div className="flex flex-col gap-4">
        {rows.map((p) => (
          <PageForm
            key={p.id}
            locale={locale}
            dict={d}
            errors={dict.admin.content.errors}
            page={p as PageRow}
          />
        ))}
        <PageForm locale={locale} dict={d} errors={dict.admin.content.errors} />
      </div>
    </div>
  );
}
