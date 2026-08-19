import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/data/account";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";

// Belt-and-suspenders alongside robots.txt's disallow — private, per-user
// account pages have no business appearing in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict] = await Promise.all([
    requireUser(locale, `/${locale}/dashboard`),
    getDictionary(locale),
  ]);
  const unread = await getUnreadNotificationCount(user.id);

  const name = user.name ?? user.email ?? "";
  const roleKey = user.role === "ADMIN" ? "ADMIN" : "USER";

  return (
    <DashboardChrome
      locale={locale}
      brandName={dict.brand.name}
      dict={dict.dashboard}
      themeLabel={dict.header.theme}
      user={{
        name,
        email: user.email ?? "",
        initial: (name.trim()[0] ?? "U").toUpperCase(),
        roleLabel: dict.dashboard.roles[roleKey],
      }}
      unread={unread}
      adminLabel={user.role === "ADMIN" ? dict.admin.title : undefined}
    >
      {children}
    </DashboardChrome>
  );
}
