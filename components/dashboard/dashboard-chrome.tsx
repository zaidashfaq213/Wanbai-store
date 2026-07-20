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
  BagIcon,
  HeartIcon,
  BellIcon,
  WalletIcon,
  UserIcon,
  HomeIcon,
  MenuIcon,
  ShieldIcon,
  SupportIcon,
} from "@/components/ui/icons";

type NavKey = keyof Dictionary["dashboard"]["nav"];

const ICONS: Record<string, typeof GridIcon> = {
  overview: GridIcon,
  orders: BagIcon,
  favorites: HeartIcon,
  notifications: BellIcon,
  wallet: WalletIcon,
  tickets: SupportIcon,
  profile: UserIcon,
};

export function DashboardChrome({
  locale,
  brandName,
  dict,
  themeLabel,
  user,
  unread,
  adminLabel,
  children,
}: {
  locale: Locale;
  brandName: string;
  dict: Dictionary["dashboard"];
  themeLabel: string;
  user: { name: string; email: string; initial: string; roleLabel: string };
  unread: number;
  adminLabel?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/${locale}/dashboard`;

  const items: Array<{ key: NavKey; href: string; badge?: number }> = [
    { key: "overview", href: base },
    { key: "orders", href: `${base}/orders` },
    { key: "favorites", href: `${base}/favorites` },
    { key: "notifications", href: `${base}/notifications`, badge: unread },
    { key: "wallet", href: `${base}/wallet` },
    { key: "tickets", href: `${base}/tickets` },
    { key: "profile", href: `${base}/profile` },
  ];

  const isActive = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href);
  const activeItem = items.find((i) => isActive(i.href));
  const pageTitle = activeItem ? dict.nav[activeItem.key] : dict.title;

  const sidebarBody = (
    <div className="flex h-full flex-col gap-1 p-3">
      {/* Brand */}
      <Link
        href={`/${locale}`}
        className="mb-3 flex items-center gap-2.5 rounded-xl px-2 py-2"
      >
        <span
          aria-hidden
          style={{ backgroundImage: "url(/logo.svg)" }}
          className="size-9 shrink-0 rounded-xl bg-contain bg-center bg-no-repeat"
        />
        <span className="flex flex-col leading-tight">
          <span className="text-base font-extrabold tracking-tight">{brandName}</span>
          <span className="text-[11px] text-muted">{dict.portal}</span>
        </span>
      </Link>

      {/* Nav */}
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

      {/* Admin link (admins only) */}
      {adminLabel && (
        <Link
          href={`/${locale}/admin`}
          className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
        >
          <ShieldIcon className="size-[18px] shrink-0" />
          {adminLabel}
        </Link>
      )}

      {/* Logout (asks for confirmation first) */}
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
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-border bg-surface lg:block">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 w-64 max-w-[80vw] border-e border-border bg-surface shadow-[var(--shadow-pop)] ltr:left-0 rtl:right-0">
            {sidebarBody}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
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
            aria-label={dict.backToStore}
            title={dict.backToStore}
            className="grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <HomeIcon className="size-5" />
          </Link>

          <Link
            href={`${base}/notifications`}
            aria-label={dict.nav.notifications}
            className="relative grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <BellIcon className="size-5" />
            {unread > 0 && (
              <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-red-500" />
            )}
          </Link>

          <Link
            href={`${base}/profile`}
            className="flex items-center gap-2.5 rounded-xl py-1 ltr:pl-2 rtl:pr-2"
          >
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-bold">{user.name}</span>
              <span className="text-[11px] text-muted">{user.roleLabel}</span>
            </div>
            <span className="grid size-9 place-items-center rounded-full brand-gradient text-sm font-bold text-white">
              {user.initial}
            </span>
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
