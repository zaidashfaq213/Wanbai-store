import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getHelpFaqs, getSettings } from "@/lib/data/content";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Accordion } from "@/components/ui/accordion";
import { SupportIcon, WhatsappIcon } from "@/components/ui/icons";
import { JsonLd } from "@/components/seo/json-ld";
import { faqLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.help.title} | ${dict.brand.name}`,
    description: dict.help.subtitle,
    alternates: { canonical: `/${locale}/help` },
  };
}

export default async function HelpPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { lang } = await params;
  const { q = "" } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [dict, faqs, settings] = await Promise.all([
    getDictionary(locale),
    getHelpFaqs(),
    getSettings(),
  ]);
  const h = dict.help;
  const query = q.trim().toLowerCase();

  const matches = faqs.filter((f) => {
    if (!query) return true;
    const hay = `${f.qEn} ${f.qAr} ${f.aEn} ${f.aAr}`.toLowerCase();
    return hay.includes(query);
  });

  const groups = Object.entries(
    matches.reduce<Record<string, typeof matches>>((acc, f) => {
      (acc[f.categoryKey] ??= []).push(f);
      return acc;
    }, {}),
  );

  const catLabels = h.categories as Record<string, string>;
  const wa = settings.whatsapp?.trim();

  return (
    <Container className="py-6 sm:py-8">
      {matches.length > 0 && (
        <JsonLd
          data={faqLd(
            matches.map((f) => ({
              q: locale === "ar" ? f.qAr : f.qEn,
              a: locale === "ar" ? f.aAr : f.aEn,
            })),
          )}
        />
      )}
      <Breadcrumbs
        items={[{ label: dict.header.home, href: `/${locale}` }, { label: h.title }]}
      />

      <header className="mb-6 text-center">
        <h1 className="text-2xl font-black sm:text-3xl">{h.title}</h1>
        <p className="mt-1 text-muted">{h.subtitle}</p>
        <form action={`/${locale}/help`} className="mx-auto mt-5 max-w-lg">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder={h.searchPlaceholder}
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50"
          />
        </form>
      </header>

      {/* Support channels */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/${locale}/dashboard/tickets`}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <SupportIcon className="size-5" />
          </span>
          <span>
            <span className="block font-bold">{h.ticketCard.title}</span>
            <span className="block text-sm text-muted">{h.ticketCard.body}</span>
          </span>
        </Link>

        {wa ? (
          <a
            href={`https://wa.me/${wa.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-emerald-500/40"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <WhatsappIcon className="size-5" />
            </span>
            <span>
              <span className="block font-bold">{h.whatsappCard.title}</span>
              <span className="block text-sm text-muted">{h.whatsappCard.body}</span>
            </span>
          </a>
        ) : (
          <Link
            href={`/${locale}/contact`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <WhatsappIcon className="size-5" />
            </span>
            <span>
              <span className="block font-bold">{h.whatsappCard.title}</span>
              <span className="block text-sm text-muted">{h.whatsappCard.body}</span>
            </span>
          </Link>
        )}
      </div>

      {/* FAQ groups */}
      {groups.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-10 text-center text-muted">
          {h.empty}
        </p>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          {groups.map(([key, items]) => (
            <section key={key}>
              <h2 className="mb-3 text-lg font-extrabold">{catLabels[key] ?? key}</h2>
              <Accordion
                items={items.map((f) => ({
                  title: locale === "ar" ? f.qAr : f.qEn,
                  content: locale === "ar" ? f.aAr : f.aEn,
                }))}
              />
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
