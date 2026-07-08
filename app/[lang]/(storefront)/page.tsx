import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getCurrency } from "@/lib/data/currency";
import { getCategories, getProductsByCategory } from "@/lib/data/catalog-db";
import { Container } from "@/components/ui/container";
import { HeroSlider } from "@/components/home/hero-slider";
import { TrustBar } from "@/components/home/trust-bar";
import { CategoryStrip } from "@/components/home/category-strip";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { Testimonials } from "@/components/home/testimonials";
import { Partners } from "@/components/home/partners";
import { Newsletter } from "@/components/home/newsletter";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const currency = await getCurrency();
  const categories = await getCategories();
  const showcases = await Promise.all(
    categories.map(async (category) => ({
      category,
      items: await getProductsByCategory(
        category.slug,
        category.slug === "game-fill" ? 12 : 6,
      ),
    })),
  );

  return (
    <Container className="flex flex-col gap-12 py-6 sm:gap-16 sm:py-8">
      <div className="flex flex-col gap-6">
        <HeroSlider dict={dict} locale={locale} />
        <TrustBar dict={dict} />
      </div>

      <CategoryStrip dict={dict} locale={locale} categories={categories} />

      {showcases.map(({ category, items }) => (
        <CategoryShowcase
          key={category.slug}
          category={category}
          items={items}
          locale={locale}
          currency={currency}
          dict={dict}
        />
      ))}

      <Testimonials dict={dict} locale={locale} />
      <Partners dict={dict} />
      <Newsletter dict={dict} />
    </Container>
  );
}
