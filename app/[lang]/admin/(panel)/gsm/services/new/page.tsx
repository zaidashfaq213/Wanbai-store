import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminGsmCategories } from "@/lib/data/gsm";
import { PageHeader } from "@/components/dashboard/page-header";
import { GsmServiceCreateForm } from "@/components/admin/gsm-service-create-form";

export default async function NewGsmServicePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const s = dict.admin.gsm.services;
  const categories = await getAdminGsmCategories();

  return (
    <div>
      <PageHeader
        title={s.newService}
        subtitle={s.subtitle}
        action={
          <Link href={`/${locale}/admin/gsm/services`} className="text-sm font-bold text-muted hover:text-foreground">
            {s.back}
          </Link>
        }
      />
      <GsmServiceCreateForm
        locale={locale}
        dict={s}
        errors={dict.admin.gsm.errors}
        categories={categories.map((c) => ({ id: c.id, label: locale === "ar" ? c.nameAr : c.nameEn }))}
      />
    </div>
  );
}
