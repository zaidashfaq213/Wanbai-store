import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getSettings } from "@/lib/data/content";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContactForm } from "@/components/contact/contact-form";
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
    title: dict.contact.title,
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

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl brand-gradient px-6 py-10 text-center text-white sm:py-14">
        <div className="pointer-events-none absolute -top-16 size-56 rounded-full bg-white/15 blur-3xl ltr:right-0 rtl:left-0" />
        <div className="pointer-events-none absolute -bottom-16 size-56 rounded-full bg-white/10 blur-3xl ltr:left-0 rtl:right-0" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
          <SupportIcon className="size-3.5" />
          {c.heroTag}
        </span>
        <h1 className="relative mt-3 text-2xl font-black sm:text-4xl">{c.title}</h1>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-white/90 sm:text-base">
          {c.subtitle}
        </p>
      </div>

      {/* Content */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        {/* Channels */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-muted">{c.channelsTitle}</h2>

          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
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
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-fuchsia-500/10 text-fuchsia-500">
              <SupportIcon className="size-5" />
            </span>
            <span>
              <span className="block font-bold">{c.ticket}</span>
              <span className="block text-sm text-muted">{c.ticketBody}</span>
            </span>
          </Link>

          <p className="px-1 text-xs text-muted">{c.hoursNote}</p>
        </div>

        {/* Email form */}
        <ContactForm
          dict={{
            formTitle: c.formTitle,
            formSubtitle: c.formSubtitle,
            name: c.name,
            emailAddress: c.emailAddress,
            subject: c.subject,
            message: c.message,
            send: c.send,
            sending: c.sending,
            sent: c.sent,
            errorGeneric: c.errorGeneric,
          }}
        />
      </div>
    </Container>
  );
}
