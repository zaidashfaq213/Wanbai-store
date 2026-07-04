import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { categories } from "@/lib/data/catalog";
import { getCurrency } from "@/lib/data/currency";
import { getSessionUser } from "@/lib/auth/session";
import { isFavorited, getWalletSummary } from "@/lib/data/account";
import {
  getProductBySlug,
  getProductDetail,
  relatedProducts,
} from "@/lib/data/product-detail";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductArt, ProductCard } from "@/components/ui/product-card";
import { StarRating } from "@/components/ui/star-rating";
import { Accordion } from "@/components/ui/accordion";
import { ReviewsSection } from "@/components/product/reviews-section";
import { PurchasePanel, ShareSaveButtons } from "@/components/product/purchase-panel";
import { BoltIcon, MailIcon, ShieldIcon } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const dict = await getDictionary(locale);
  const name = product.name[locale];
  return {
    title: `${name} | ${dict.brand.name}`,
    description: getProductDetail(product).overview[locale],
    alternates: { canonical: `/${locale}/product/${slug}` },
    openGraph: { title: `${name} | ${dict.brand.name}`, type: "website" },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const dict = await getDictionary(locale);
  const currency = await getCurrency();
  const detail = getProductDetail(product);
  const category = categories.find((c) => c.slug === product.category);

  const user = await getSessionUser();
  const isAuthed = Boolean(user);
  let initialSaved = false;
  let walletBalanceCents = 0;
  if (user) {
    initialSaved = await isFavorited(user.id, product.slug);
    walletBalanceCents = (await getWalletSummary(user.id)).balance;
  }
  const related = relatedProducts(product);
  const totalReviews = detail.ratingBreakdown.reduce((a, b) => a + b, 0);
  const p = dict.product;

  const badges = [p.badgeSafe, p.badgeInstant, p.badgeTrusted];
  const accordionItems = [
    { title: p.overview, content: detail.overview[locale] },
    { title: p.howToUse, content: detail.howToUse[locale] },
    ...detail.faqs.map((f) => ({ title: f.q[locale], content: f.a[locale] })),
  ];

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: dict.header.home, href: `/${locale}` },
          { label: dict.catalog.title, href: `/${locale}/cards` },
          ...(category
            ? [{ label: category.name[locale], href: `/${locale}/cards/${category.slug}` }]
            : []),
          { label: product.name[locale] },
        ]}
      />

      {/* Top: art + purchase */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface-2 to-surface-3 p-6 shadow-[var(--shadow-card)]">
            <ProductArt
              src={product.image ?? `/products/${product.slug}.svg`}
              cover={Boolean(product.image)}
              name={product.name[locale]}
              className="mx-auto aspect-square w-full max-w-72 rounded-2xl"
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { Icon: ShieldIcon, label: badges[0] },
              { Icon: BoltIcon, label: badges[1] },
              { Icon: ShieldIcon, label: badges[2] },
            ].map(({ Icon, label }, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-2.5 text-center"
              >
                <Icon className="size-5 text-primary" />
                <span className="text-xs font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">{product.name[locale]}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <StarRating value={product.rating} />
                <span className="font-bold">{product.rating.toFixed(1)}</span>
                <span className="text-muted">
                  ({product.reviews} {dict.product.reviews})
                </span>
              </div>
            </div>
            <ShareSaveButtons
              dict={dict}
              locale={locale}
              name={product.name[locale]}
              productSlug={product.slug}
              isAuthed={isAuthed}
              initialSaved={initialSaved}
            />
          </div>

          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
            <MailIcon className="size-4" />
            {p.delivery}
          </p>

          <div className="mt-6">
            <PurchasePanel
              product={{
                slug: product.slug,
                name: product.name[locale],
                categorySlug: product.category,
              }}
              variantGroups={detail.variantGroups}
              inputs={detail.inputs}
              fulfillment={detail.fulfillment}
              currency={currency}
              locale={locale}
              dict={dict}
              isAuthed={isAuthed}
              walletBalanceCents={walletBalanceCents}
            />
          </div>
        </div>
      </div>

      {/* Info accordions */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-black">{p.faqTitle}</h2>
        <Accordion items={accordionItems} />
      </section>

      {/* Reviews */}
      <div className="mt-12">
        <ReviewsSection
          rating={product.rating}
          totalReviews={totalReviews}
          breakdown={detail.ratingBreakdown}
          reviews={detail.reviews}
          locale={locale}
          dict={dict}
        />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-black">{p.related}</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {related.map((rp) => (
              <div key={rp.slug} className="w-[42vw] max-w-44 shrink-0 sm:w-auto sm:max-w-none">
                <ProductCard product={rp} locale={locale} currency={currency} dict={dict} />
              </div>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
