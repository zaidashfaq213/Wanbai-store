import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/forms";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ email?: string; notice?: string }>;
}) {
  const { lang } = await params;
  const { email, notice } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  // Without an email to verify there's nothing to do — send them to signup.
  if (!email) redirect(`/${locale}/signup`);

  return (
    <AuthShell
      locale={locale}
      brandName={dict.brand.name}
      panel={dict.auth.panel}
      title={dict.auth.verify.title}
      subtitle={dict.auth.verify.subtitle}
    >
      <VerifyEmailForm
        dict={dict.auth}
        locale={locale}
        email={email}
        notice={notice === "unverified" ? "unverified" : undefined}
      />
    </AuthShell>
  );
}
