import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cairo } from "next/font/google";
import "../globals.css";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  isLocale,
  localeDirection,
  locales,
  defaultLocale,
  type Locale,
} from "@/lib/i18n/config";
import { getCurrency } from "@/lib/data/currency";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans-stack",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    metadataBase: new URL("https://wanbai.store"),
    alternates: {
      languages: { ar: "/ar", en: "/en" },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      type: "website",
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dir = localeDirection[locale];
  const dict = await getDictionary(locale);
  const currency = await getCurrency();
  const isDark = (await cookies()).get("theme")?.value === "dark";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} h-full${isDark ? " dark" : ""}`}
      style={{ colorScheme: isDark ? "dark" : "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header dict={dict} locale={locale} currencyCode={currency.code} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer dict={dict} locale={locale} />
        <MobileBottomNav dict={dict} locale={locale} />
      </body>
    </html>
  );
}
