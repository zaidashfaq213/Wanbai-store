import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/forms";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  // Already an admin? Straight to the panel. Logged-in non-admins go to store.
  const user = await getSessionUser();
  if (user?.role === "ADMIN") redirect(`/${locale}/admin`);
  if (user) redirect(`/${locale}/dashboard`);

  return (
    <AuthShell
      locale={locale}
      brandName={dict.brand.name}
      panel={dict.auth.panel}
      title={`${dict.admin.title} · ${dict.auth.login.title}`}
      subtitle={dict.admin.portal}
    >
      <LoginForm dict={dict.auth} locale={locale} next="admin" hideOAuth />
    </AuthShell>
  );
}
