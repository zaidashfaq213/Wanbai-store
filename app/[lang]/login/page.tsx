import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { enabledOAuth } from "@/auth";
import { getSessionUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/forms";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ verified?: string }>;
}) {
  const { lang } = await params;
  const { verified } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  if (await getSessionUser()) redirect(`/${locale}/dashboard`);

  return (
    <AuthShell
      locale={locale}
      brandName={dict.brand.name}
      title={dict.auth.login.title}
      subtitle={dict.auth.login.subtitle}
    >
      <LoginForm
        dict={dict.auth}
        locale={locale}
        enabled={enabledOAuth}
        verified={verified === "1"}
      />
    </AuthShell>
  );
}
