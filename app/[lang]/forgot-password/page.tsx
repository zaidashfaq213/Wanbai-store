import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forms";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return (
    <AuthShell
      locale={locale}
      brandName={dict.brand.name}
      title={dict.auth.forgot.title}
      subtitle={dict.auth.forgot.subtitle}
    >
      <ForgotPasswordForm dict={dict.auth} locale={locale} />
    </AuthShell>
  );
}
