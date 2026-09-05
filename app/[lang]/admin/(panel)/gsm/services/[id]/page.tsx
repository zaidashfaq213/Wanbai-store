import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminGsmService, getAdminGsmCategories } from "@/lib/data/gsm";
import { PageHeader } from "@/components/dashboard/page-header";
import { GsmServiceEditForm } from "@/components/admin/gsm-service-edit-form";
import { GsmServiceFieldsEditor } from "@/components/admin/gsm-service-fields-editor";

export default async function EditGsmServicePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const s = dict.admin.gsm.services;
  const [service, categories] = await Promise.all([getAdminGsmService(id), getAdminGsmCategories()]);
  if (!service) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageHeader
        title={locale === "ar" ? service.nameAr : service.nameEn}
        subtitle={s.subtitle}
        action={
          <Link href={`/${locale}/admin/gsm/services`} className="text-sm font-bold text-muted hover:text-foreground">
            {s.back}
          </Link>
        }
      />
      <GsmServiceEditForm
        locale={locale}
        dict={s}
        errors={dict.admin.gsm.errors}
        confirm={dict.admin.confirm}
        categories={categories.map((c) => ({ id: c.id, label: locale === "ar" ? c.nameAr : c.nameEn }))}
        service={{
          id: service.id,
          categoryId: service.categoryId,
          slug: service.slug,
          nameEn: service.nameEn,
          nameAr: service.nameAr,
          priceUsd: service.price / 100,
          descriptionEn: service.descriptionEn,
          descriptionAr: service.descriptionAr,
          requirementsEn: service.requirementsEn,
          requirementsAr: service.requirementsAr,
          processingTimeEn: service.processingTimeEn,
          processingTimeAr: service.processingTimeAr,
          active: service.active,
        }}
      />
      <GsmServiceFieldsEditor
        locale={locale}
        dict={s.fields}
        errors={dict.admin.gsm.errors}
        confirm={dict.admin.confirm}
        serviceId={service.id}
        rows={service.fields.map((f) => ({
          id: f.id,
          key: f.key,
          labelEn: f.labelEn,
          labelAr: f.labelAr,
          kind: f.kind,
          required: f.required,
        }))}
      />
    </div>
  );
}
