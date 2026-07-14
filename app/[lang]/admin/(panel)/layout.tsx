import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getPendingSubmissionCount } from "@/lib/data/payments";
import { getOpenTicketCount } from "@/lib/data/content";
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
  const user = await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const [pending, openTickets] = await Promise.all([
    getPendingSubmissionCount(),
    getOpenTicketCount(),
  ]);

  const name = user.name ?? user.email ?? "Admin";

  return (
    <AdminChrome
      locale={locale}
      brandName={dict.brand.name}
      dict={dict.admin}
      themeLabel={dict.header.theme}
      user={{ name, initial: (name.trim()[0] ?? "A").toUpperCase() }}
      pending={pending}
      openTickets={openTickets}
    >
      {children}
    </AdminChrome>
  );
}
