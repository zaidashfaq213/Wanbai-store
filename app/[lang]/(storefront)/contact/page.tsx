import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getSettings } from "@/lib/data/content";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  WhatsappIcon,
  TelegramIcon,
  MailIcon,
  SupportIcon,
} from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.contact.title} | ${dict.brand.name}`,
    description: dict.contact.subtitle,
    alternates: { canonical: `/${locale}/contact` },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const c = dict.contact;
  const s = await getSettings();

  const wa = s.whatsapp?.trim();
  const tg = s.telegram?.trim();
  const email = s.supportEmail?.trim();

  const channels = [
    wa && {
      Icon: WhatsappIcon,
      label: c.whatsapp,
      value: wa,
      href: `https://wa.me/${wa.replace(/[^0-9]/g, "")}`,
      tint: "bg-emerald-500/10 text-emerald-500",
    },
    tg && {
      Icon: TelegramIcon,
      label: c.telegram,
      value: tg,
      href: `https://t.me/${tg.replace(/^@/, "")}`,
      tint: "bg-sky-500/10 text-sky-500",
    },
    email && {
      Icon: MailIcon,
      label: c.email,
      value: email,
      href: `mailto:${email}`,
      tint: "bg-primary/10 text-primary",
    },
  ].filter(Boolean) as Array<{
    Icon: typeof MailIcon;
    label: string;
    value: string;
    href: string;
    tint: string;
  }>;

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        items={[{ label: dict.header.home, href: `/${locale}` }, { label: c.title }]}
      />

      <div className="mx-auto max-w-2xl">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-black sm:text-3xl">{c.title}</h1>
          <p className="mt-1 text-muted">{c.subtitle}</p>
        </header>

        <div className="flex flex-col gap-3">
          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
            >
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${ch.tint}`}>
                <ch.Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{ch.label}</span>
                <span className="block truncate text-sm text-muted" dir="ltr">
                  {ch.value}
                </span>
              </span>
            </a>
          ))}

          {/* Support tickets are the reliable, tracked channel */}
          <Link
            href={`/${locale}/dashboard/tickets`}
            className="flex items-center gap-3 rounded-2xl brand-gradient p-4 text-white transition-transform hover:scale-[1.01]"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/20">
              <SupportIcon className="size-5" />
            </span>
            <span>
              <span className="block font-bold">{c.ticket}</span>
              <span className="block text-sm opacity-90">{c.ticketBody}</span>
            </span>
          </Link>
        </div>
      </div>
    </Container>
  );
}
