import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getCurrency } from "@/lib/data/currency";
import { getCategories } from "@/lib/data/catalog-db";
import { getSettings } from "@/lib/data/content";
import { getSessionUser } from "@/lib/auth/session";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationLd, websiteLd } from "@/lib/seo";

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
  // Independent fetches — run concurrently instead of stacking up latency.
  const [dict, currency, categories, settings, sessionUser] = await Promise.all([
    getDictionary(locale),
    getCurrency(),
    getCategories(),
    getSettings(),
    getSessionUser(),
  ]);
  const accountName = sessionUser
    ? sessionUser.name ?? sessionUser.email ?? null
    : null;

  const socialLinks = [
    settings.facebook,
    settings.instagram,
    settings.youtube,
    settings.tiktok,
  ].filter((v): v is string => Boolean(v));

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={[
          organizationLd(dict.brand, socialLinks),
          websiteLd(dict.brand, locale),
        ]}
      />
      <Header
        dict={dict}
        locale={locale}
        currencyCode={currency.code}
        accountName={accountName}
        categories={categories}
        logo={settings.logo}
      />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer
        dict={dict}
        locale={locale}
        categories={categories}
        logo={settings.logo}
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
