import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getStaffList } from "@/lib/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { StaffManager } from "@/components/admin/staff-manager";

export default async function AdminStaffPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const admin = await requireAdmin(locale); // Supervisor only
  const dict = await getDictionary(locale);
  const staff = await getStaffList();

  return (
    <div>
      <PageHeader title={dict.admin.staff.title} subtitle={dict.admin.staff.subtitle} />
      <StaffManager
        locale={locale}
        dict={dict.admin.staff}
        errors={dict.auth.errors}
        confirm={dict.admin.confirm}
        adminId={admin.id}
        staff={staff.map((s) => ({
          id: s.id,
          name: s.name,
          username: s.username,
          email: s.email,
          role: s.role,
        }))}
      />
    </div>
  );
}
