import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getPost } from "@/lib/data/content";
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
  const [post, dict] = await Promise.all([getPost(slug), getDictionary(locale)]);
  if (!post) return {};
  const title = locale === "ar" ? post.titleAr : post.titleEn;
  const description = locale === "ar" ? post.excerptAr : post.excerptEn;
  return {
    title: `${title} | ${dict.brand.name}`,
    description,
    alternates: { canonical: `/${locale}/blog/${slug}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [post, dict] = await Promise.all([getPost(slug), getDictionary(locale)]);
  if (!post) notFound();

  const title = locale === "ar" ? post.titleAr : post.titleEn;
  const body = locale === "ar" ? post.bodyAr : post.bodyEn;

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: dict.header.home, href: `/${locale}` },
          { label: dict.blog.title, href: `/${locale}/blog` },
          { label: title },
        ]}
      />
      <article className="mx-auto max-w-3xl">
        <p className="text-xs text-muted">
          {new Date(post.publishedAt).toLocaleDateString(
            locale === "ar" ? "ar-EG" : "en-US",
          )}
        </p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h1>
        <Prose text={body} className="mt-6" />
        <Link
          href={`/${locale}/blog`}
          className="mt-8 inline-block text-sm font-bold text-primary hover:underline"
        >
          {dict.blog.back}
        </Link>
      </article>
    </Container>
  );
}
