import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getCurrency } from "@/lib/data/currency";
import { getCategories } from "@/lib/data/catalog-db";
import { getSettings } from "@/lib/data/content";
import { getSessionUser } from "@/lib/auth/session";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

// Chrome for the public storefront: header, footer and mobile bottom nav.
// The dashboard and auth screens deliberately do NOT use this layout.
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const currency = await getCurrency();
  const categories = await getCategories();
  const settings = await getSettings();
  const sessionUser = await getSessionUser();
  const accountName = sessionUser
    ? sessionUser.name ?? sessionUser.email ?? null
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        dict={dict}
        locale={locale}
        currencyCode={currency.code}
        accountName={accountName}
        categories={categories}
      />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer
        dict={dict}
        locale={locale}
        categories={categories}
        socials={{
          whatsapp: settings.whatsapp,
          telegram: settings.telegram,
          facebook: settings.facebook,
          instagram: settings.instagram,
          youtube: settings.youtube,
          tiktok: settings.tiktok,
        }}
      />
      <MobileBottomNav dict={dict} locale={locale} />
    </div>
  );
}
