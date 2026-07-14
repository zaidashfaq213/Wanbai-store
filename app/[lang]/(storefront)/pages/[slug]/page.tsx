import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getPage } from "@/lib/data/content";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Prose } from "@/components/ui/prose";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const page = await getPage(slug);
  if (!page) return {};
  const dict = await getDictionary(locale);
  const title = locale === "ar" ? page.titleAr : page.titleEn;
  return {
    title: `${title} | ${dict.brand.name}`,
    alternates: { canonical: `/${locale}/pages/${slug}` },
    openGraph: { title: `${title} | ${dict.brand.name}`, type: "article" },
  };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const page = await getPage(slug);
  if (!page) notFound();
  const dict = await getDictionary(locale);

  const title = locale === "ar" ? page.titleAr : page.titleEn;
  const body = locale === "ar" ? page.bodyAr : page.bodyEn;

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[{ label: dict.header.home, href: `/${locale}` }, { label: title }]}
      />
      <article className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
        <p className="mt-1 text-xs text-muted">
          {new Date(page.updatedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
        </p>
        <Prose text={body} className="mt-6" />
      </article>
    </Container>
  );
}
