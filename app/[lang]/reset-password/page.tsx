import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/forms";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { lang } = await params;
  const { token } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return (
    <AuthShell
      locale={locale}
      brandName={dict.brand.name}
      panel={dict.auth.panel}
      title={dict.auth.reset.title}
      subtitle={dict.auth.reset.subtitle}
    >
      <ResetPasswordForm dict={dict.auth} locale={locale} token={token ?? ""} />
    </AuthShell>
  );
}
