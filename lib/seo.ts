import { locales, type Locale } from "@/lib/i18n/config";

// Single source of truth for the public origin. Set APP_URL in .env to your
// real domain — metadata, sitemap, robots and all JSON-LD read from here.
export const SITE_URL = (
  process.env.APP_URL ??
  process.env.AUTH_URL ??
  "https://wanbai-stoer.com"
).replace(/\/$/, "");

export function abs(path = ""): string {
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Per-locale <link rel="alternate" hreflang> map, incl. x-default. */
export function languageAlternates(path = ""): Record<string, string> {
  const clean = path.replace(/^\/(ar|en)(?=\/|$)/, "");
  const out: Record<string, string> = {};
  for (const l of locales) out[l] = abs(`/${l}${clean}`);
  out["x-default"] = abs(`/${defaultLocaleForDefault()}${clean}`);
  return out;
}

function defaultLocaleForDefault(): Locale {
  return locales[0];
}

type Brand = { name: string; tagline: string };

/** Organization schema — helps Google build the brand knowledge panel. */
export function organizationLd(brand: Brand, sameAs: string[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: SITE_URL,
    logo: abs("/logo.svg"),
    description: brand.tagline,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * WebSite schema with a SearchAction, so Google can show the sitelinks search
 * box and index the site under its name in Arabic and English.
 */
export function websiteLd(brand: Brand, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: abs(`/${locale}`),
    inLanguage: locale === "ar" ? "ar" : "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: abs(`/${locale}/search?q={search_term_string}`),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * FAQPage schema — the single highest-leverage addition here: Google can show
 * these Q&As directly in search results ("rich results"), which means more
 * screen real estate and more clicks without ranking any higher. Used on the
 * Help Center and on every product page (each product already has its own
 * FAQ list).
 */
export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

/** BlogPosting schema — lets Google show the publish date and author in
 * search results, and is a baseline requirement for blog content to be
 * eligible for Google Discover/News-adjacent surfaces. */
export function articleLd(input: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt: string;
  brandName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: input.url,
    datePublished: input.publishedAt,
    ...(input.image ? { image: input.image } : {}),
    author: { "@type": "Organization", name: input.brandName },
    publisher: { "@type": "Organization", name: input.brandName },
    mainEntityOfPage: input.url,
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function productLd(input: {
  name: string;
  description: string;
  slug: string;
  locale: Locale;
  image: string;
  priceUsd: number;
  brandName: string;
  rating?: number;
  reviews?: number;
}) {
  const url = abs(`/${input.locale}/product/${input.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image.startsWith("http") ? input.image : abs(input.image),
    brand: { "@type": "Brand", name: input.brandName },
    url,
    offers: {
      "@type": "Offer",
      price: input.priceUsd.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url,
    },
    ...(input.reviews && input.reviews > 0 && input.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating.toFixed(1),
            reviewCount: input.reviews,
          },
        }
      : {}),
  };
}
