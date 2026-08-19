"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/ui/logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  GridIcon,
  WalletIcon,
  BagIcon,
  ShieldIcon,
  UserIcon,
  HomeIcon,
  MenuIcon,
  ListIcon,
  StarIcon,
  SupportIcon,
  MailIcon,
  GlobeIcon,
  BellIcon,
  LockIcon,
} from "@/components/ui/icons";

type NavKey = keyof Dictionary["admin"]["nav"];

const ICONS: Record<string, typeof GridIcon> = {
  overview: GridIcon,
  payments: WalletIcon,
  orders: BagIcon,
  products: StarIcon,
  categories: ListIcon,
  banks: ShieldIcon,
  users: UserIcon,
  staff: ShieldIcon,
  tickets: SupportIcon,
  reviews: StarIcon,
  pages: ListIcon,
  blog: MailIcon,
  faqs: SupportIcon,
  settings: GlobeIcon,
  reengagement: BellIcon,
  profile: LockIcon,
};

export function AdminChrome({
  locale,
  brandName,
  logo,
  dict,
  themeLabel,
  role,
  user,
  pending,
  openTickets,
  children,
}: {
  locale: Locale;
  brandName: string;
  logo?: string | null;
  dict: Dictionary["admin"];
  themeLabel: string;
  role: string;
  user: { name: string; initial: string };
  pending: number;
  openTickets: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/${locale}/admin`;

  const allItems: Array<{ key: NavKey; href: string; badge?: number }> = [
    { key: "overview", href: base },
    { key: "payments", href: `${base}/payments`, badge: pending },
    { key: "orders", href: `${base}/orders` },
    { key: "products", href: `${base}/products` },
    { key: "categories", href: `${base}/categories` },
    { key: "tickets", href: `${base}/tickets`, badge: openTickets },
    { key: "reviews", href: `${base}/reviews` },
    { key: "pages", href: `${base}/pages` },
    { key: "blog", href: `${base}/blog` },
    { key: "faqs", href: `${base}/faqs` },
    { key: "banks", href: `${base}/banks` },
    { key: "users", href: `${base}/users` },
    { key: "staff", href: `${base}/staff` },
    { key: "reengagement", href: `${base}/reengagement` },
    { key: "settings", href: `${base}/settings` },
    { key: "profile", href: `${base}/profile` },
  ];

  // A Manager only handles Orders (requests) + Payments (deposits), plus
  // their own account (password change); a Supervisor (ADMIN) sees everything.
  const items =
    role === "MANAGER"
      ? allItems.filter((i) => i.key === "payments" || i.key === "orders" || i.key === "profile")
      : allItems;

  const isActive = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href);
  const activeItem = items.find((i) => isActive(i.href));
  const pageTitle = activeItem ? dict.nav[activeItem.key] : dict.title;

  const sidebar = (
    <div className="flex h-full flex-col gap-1 p-3">
      <Link href={`/${locale}`} className="mb-3 flex items-center gap-2.5 rounded-xl px-2 py-2">
        <span
          aria-hidden
          style={{ backgroundImage: `url(${logo || "/logo.svg"})` }}
          className="size-9 shrink-0 rounded-xl bg-contain bg-center bg-no-repeat"
        />
        <span className="flex flex-col leading-tight">
          <span className="text-base font-extrabold tracking-tight">{brandName}</span>
          <span className="text-[11px] text-muted">{dict.portal}</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = ICONS[item.key] ?? GridIcon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "brand-gradient text-white shadow-sm"
                  : "text-foreground/80 hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="flex-1">{dict.nav[item.key]}</span>
              {item.badge ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <Link
        href={`/${locale}/dashboard`}
        className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        {dict.nav.backToStore}
      </Link>
      <LogoutButton
        locale={locale}
        labels={{
          logout: dict.nav.logout,
          logoutTitle: dict.nav.logoutTitle,
          logoutBody: dict.nav.logoutBody,
          logoutConfirm: dict.nav.logoutConfirm,
          logoutCancel: dict.nav.logoutCancel,
        }}
      />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-border bg-surface lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 w-64 max-w-[80vw] border-e border-border bg-surface shadow-[var(--shadow-pop)] ltr:left-0 rtl:right-0">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={dict.title}
            className="grid size-9 place-items-center rounded-xl border border-border bg-surface lg:hidden"
          >
            <MenuIcon className="size-5" />
          </button>
          <h1 className="flex-1 truncate text-lg font-bold">{pageTitle}</h1>
          <ThemeToggle label={themeLabel} />
          <Link
            href={`/${locale}`}
            aria-label={dict.nav.backToStore}
            className="grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <HomeIcon className="size-5" />
          </Link>
          <span className="flex items-center gap-2.5">
            <span className="hidden text-sm font-bold sm:block">{user.name}</span>
            <span className="grid size-9 place-items-center rounded-full brand-gradient text-sm font-bold text-white">
              {user.initial}
            </span>
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
