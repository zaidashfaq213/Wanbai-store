import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { categories } from "@/lib/data/catalog";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import {
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@/components/ui/icons";

const socials = [
  { Icon: FacebookIcon, href: "#", label: "Facebook" },
  { Icon: InstagramIcon, href: "#", label: "Instagram" },
  { Icon: YoutubeIcon, href: "#", label: "YouTube" },
  { Icon: TiktokIcon, href: "#", label: "TikTok" },
  { Icon: TelegramIcon, href: "#", label: "Telegram" },
  { Icon: WhatsappIcon, href: "#", label: "WhatsApp" },
];

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const supportLinks = [
    { label: dict.footer.helpCenter, href: `/${locale}/help` },
    { label: dict.footer.contact, href: `/${locale}/contact` },
    { label: dict.footer.blog, href: `/${locale}/blog` },
  ];
  const legalLinks = [
    { label: dict.footer.about, href: `/${locale}/pages/about-us` },
    { label: dict.footer.terms, href: `/${locale}/pages/terms-and-conditions` },
    { label: dict.footer.privacy, href: `/${locale}/pages/privacy-policy` },
    { label: dict.footer.returns, href: `/${locale}/pages/return-policy` },
    { label: dict.footer.cookies, href: `/${locale}/pages/cookie-policy` },
    { label: dict.footer.gdpr, href: `/${locale}/pages/gdpr` },
  ];

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo locale={locale} name={dict.brand.name} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            {dict.footer.blurb}
          </p>
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              {dict.footer.follow}
            </p>
            <div className="flex flex-wrap gap-2">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-xl border border-border bg-background text-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="size-[18px]" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <FooterColumn title={dict.header.allCategories}>
          {categories.slice(0, 6).map((c) => (
            <FooterLink key={c.slug} href={`/${locale}/cards/${c.slug}`}>
              {c.name[locale]}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title={dict.footer.support}>
          {supportLinks.map((l) => (
            <FooterLink key={l.href} href={l.href}>
              {l.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title={dict.footer.legal}>
          {legalLinks.map((l) => (
            <FooterLink key={l.href} href={l.href}>
              {l.label}
            </FooterLink>
          ))}
        </FooterColumn>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {dict.brand.name}. {dict.footer.rights}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted ltr:mr-1 rtl:ml-1">
              {dict.footer.payments}:
            </span>
            {["VISA", "MC", "mada", "Apple", "PayPal"].map((p) => (
              <span
                key={p}
                className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-bold text-muted"
              >
                {p}
              </span>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted transition-colors hover:text-primary"
      >
        {children}
      </Link>
    </li>
  );
}
