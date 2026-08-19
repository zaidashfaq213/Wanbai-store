import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireStaff } from "@/lib/auth/session";
import { AdminPasswordForm } from "@/components/admin/profile-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function AdminProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [, dict] = await Promise.all([requireStaff(locale), getDictionary(locale)]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={dict.admin.profile.title}
        subtitle={dict.admin.profile.subtitle}
      />
      <AdminPasswordForm
        dict={{
          title: dict.admin.profile.formTitle,
          subtitle: dict.admin.profile.formSubtitle,
          current: dict.admin.profile.current,
          next: dict.admin.profile.next,
          confirm: dict.admin.profile.confirm,
          save: dict.admin.profile.save,
          saved: dict.admin.profile.saved,
          errors: dict.admin.profile.errors,
        }}
      />
    </div>
  );
}
