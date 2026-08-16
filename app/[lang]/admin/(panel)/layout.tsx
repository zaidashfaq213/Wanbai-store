import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireStaff } from "@/lib/auth/session";
import { getPendingSubmissionCount } from "@/lib/data/payments";
import { getOpenTicketCount, getSettings } from "@/lib/data/content";
import { AdminChrome } from "@/components/admin/admin-chrome";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict, pending, openTickets, settings] = await Promise.all([
    requireStaff(locale),
    getDictionary(locale),
    getPendingSubmissionCount(),
    getOpenTicketCount(),
    getSettings(),
  ]);

  const name = user.name ?? user.email ?? "Admin";

  return (
    <AdminChrome
      locale={locale}
      brandName={dict.brand.name}
      logo={settings.logo ? "/api/logo" : null}
      dict={dict.admin}
      themeLabel={dict.header.theme}
      role={user.role}
      user={{ name, initial: (name.trim()[0] ?? "A").toUpperCase() }}
      pending={pending}
      openTickets={openTickets}
    >
      {children}
    </AdminChrome>
  );
}
