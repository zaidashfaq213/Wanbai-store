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
import { SITE_URL, abs, languageAlternates } from "@/lib/seo";

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
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.meta.title,
      // Every page gets "<page> | <brand>" automatically.
      template: `%s | ${dict.brand.name}`,
    },
    description: dict.meta.description,
    applicationName: dict.brand.name,
    keywords: dict.meta.keywords,
    alternates: {
      canonical: abs(`/${locale}`),
      languages: languageAlternates(`/${locale}`),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      siteName: dict.brand.name,
      url: abs(`/${locale}`),
      locale: locale === "ar" ? "ar_AR" : "en_US",
      type: "website",
      images: [{ url: abs("/og.png"), width: 1200, height: 630, alt: dict.brand.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
      images: [abs("/og.png")],
    },
  };
}

// Root layout only owns <html>/<body>, fonts, theme and direction. Page chrome
// (storefront header/footer vs. dashboard sidebar vs. bare auth screens) is
// decided by the nested layouts below it.
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
  const isDark = (await cookies()).get("theme")?.value === "dark";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} h-full${isDark ? " dark" : ""}`}
      style={{ colorScheme: isDark ? "dark" : "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
