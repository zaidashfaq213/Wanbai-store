import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/forms";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  if (await getSessionUser()) redirect(`/${locale}/dashboard`);

  return (
    <AuthShell
      locale={locale}
      brandName={dict.brand.name}
      panel={dict.auth.panel}
      title={dict.auth.signup.title}
      subtitle={dict.auth.signup.subtitle}
    >
      <SignupForm dict={dict.auth} locale={locale} />
    </AuthShell>
  );
}
