import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getHelpFaqs, HELP_CATEGORIES } from "@/lib/data/content";
import { PageHeader } from "@/components/dashboard/page-header";
import { FaqForm, type FaqRow } from "@/components/admin/content-forms";

export default async function AdminFaqsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.content.faqs;
  const rows = await getHelpFaqs();
  const cats = [...HELP_CATEGORIES];

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <div className="flex flex-col gap-4">
        {rows.map((f) => (
          <FaqForm
            key={f.id}
            locale={locale}
            dict={d} confirm={dict.admin.confirm}
            errors={dict.admin.content.errors}
            faq={f as FaqRow}
            categories={cats}
          />
        ))}
        <FaqForm locale={locale} dict={d} confirm={dict.admin.confirm} errors={dict.admin.content.errors} categories={cats} />
      </div>
    </div>
  );
}
