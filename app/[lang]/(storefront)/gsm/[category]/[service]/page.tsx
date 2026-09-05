import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getGsmServiceBySlug } from "@/lib/data/gsm";
import { getCurrency } from "@/lib/data/currency";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Accordion } from "@/components/ui/accordion";
import { GsmOrderForm } from "@/components/gsm/gsm-order-form";
import { ClockIcon, ShieldIcon, SupportIcon } from "@/components/ui/icons";
import { JsonLd } from "@/components/seo/json-ld";
import { abs, breadcrumbLd, serviceLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; service: string }>;
}): Promise<Metadata> {
  const { lang, service } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const svc = await getGsmServiceBySlug(service);
  if (!svc) return {};
  const name = locale === "ar" ? svc.nameAr : svc.nameEn;
  return {
    title: name,
    description: locale === "ar" ? svc.descriptionAr : svc.descriptionEn,
    alternates: { canonical: abs(`/${locale}/gsm/${svc.category.slug}/${svc.slug}`) },
  };
}

export default async function GsmServicePage({
  params,
}: {
  params: Promise<{ lang: string; category: string; service: string }>;
}) {
  const { lang, category, service } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [dict, svc, currency, user] = await Promise.all([
    getDictionary(locale),
    getGsmServiceBySlug(service),
    getCurrency(),
    getSessionUser(),
  ]);
  if (!svc || svc.category.slug !== category) notFound();

  const walletBalanceCents = user
    ? ((await prisma.user.findUnique({ where: { id: user.id }, select: { walletBalance: true } }))?.walletBalance ?? 0)
    : 0;

  const g = dict.gsm;
  const name = locale === "ar" ? svc.nameAr : svc.nameEn;
  const categoryName = locale === "ar" ? svc.category.nameAr : svc.category.nameEn;
  const description = locale === "ar" ? svc.descriptionAr : svc.descriptionEn;
  const requirements = locale === "ar" ? svc.requirementsAr : svc.requirementsEn;
  const processingTime = locale === "ar" ? svc.processingTimeAr : svc.processingTimeEn;

  const accordionItems = [
    ...(description ? [{ title: g.description, content: description }] : []),
    ...(requirements ? [{ title: g.requirements, content: requirements }] : []),
  ];

  return (
    <Container className="py-6 sm:py-8">
      <JsonLd
        data={[
          serviceLd({
            name,
            description: description || g.heroSubtitle,
            slug: svc.slug,
            categorySlug: category,
            locale,
            priceUsd: svc.price / 100,
            brandName: dict.brand.name,
          }),
          breadcrumbLd([
            { name: dict.header.home, url: abs(`/${locale}`) },
            { name: g.heroTitle, url: abs(`/${locale}/gsm`) },
            { name: categoryName, url: abs(`/${locale}/gsm/${category}`) },
            { name, url: abs(`/${locale}/gsm/${category}/${svc.slug}`) },
          ]),
        ]}
      />
      <Breadcrumbs
        items={[
          { label: dict.header.home, href: `/${locale}` },
          { label: g.heroTitle, href: `/${locale}/gsm` },
          { label: categoryName, href: `/${locale}/gsm/${category}` },
          { label: name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-5">
          <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-6 sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -top-10 text-8xl opacity-[0.08] ltr:-right-4 rtl:-left-4">
              {svc.category.icon}
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {svc.category.icon} {categoryName}
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{name}</h1>
            <p className="mt-3 text-3xl font-black text-primary">
              {formatCents(svc.price, currency.symbol, currency.rate, locale)}
            </p>
          </header>

          <div className="grid grid-cols-3 gap-2">
            {[
              { Icon: ClockIcon, label: processingTime || "—" },
              { Icon: ShieldIcon, label: g.trustSecure },
              { Icon: SupportIcon, label: g.trustSupport },
            ].map(({ Icon, label }, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3 text-center"
              >
                <Icon className="size-5 text-primary" />
                <span className="text-[11px] font-bold leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {accordionItems.length > 0 && <Accordion items={accordionItems} />}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <GsmOrderForm
            locale={locale}
            dict={dict}
            serviceId={svc.id}
            priceCents={svc.price}
            currency={currency}
            isAuthed={Boolean(user)}
            walletBalanceCents={walletBalanceCents}
            fields={svc.fields.map((f) => ({
              id: f.id,
              key: f.key,
              label: locale === "ar" ? f.labelAr : f.labelEn,
              placeholder: locale === "ar" ? f.placeholderAr : f.placeholderEn,
              kind: f.kind,
              required: f.required,
            }))}
          />
        </div>
      </div>
    </Container>
  );
}
