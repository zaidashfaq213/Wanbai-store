import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getPosts } from "@/lib/data/content";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowIcon } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.blog.title} | ${dict.brand.name}`,
    description: dict.blog.subtitle,
    alternates: { canonical: `/${locale}/blog` },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [dict, posts] = await Promise.all([getDictionary(locale), getPosts()]);
  const b = dict.blog;

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[{ label: dict.header.home, href: `/${locale}` }, { label: b.title }]}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">{b.title}</h1>
        <p className="mt-1 text-muted">{b.subtitle}</p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-10 text-center text-muted">
          {b.empty}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
            >
              <p className="text-xs text-muted">
                {new Date(post.publishedAt).toLocaleDateString(
                  locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
                )}
              </p>
              <h2 className="mt-1 text-lg font-extrabold leading-snug">
                {locale === "ar" ? post.titleAr : post.titleEn}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted">
                {locale === "ar" ? post.excerptAr : post.excerptEn}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
                {b.readMore}
                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
