"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import {
  BagIcon,
  BellIcon,
  HeartIcon,
  HomeIcon,
  SupportIcon,
} from "@/components/ui/icons";

export function MobileBottomNav({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const pathname = usePathname();
  const items = [
    { href: `/${locale}`, label: dict.bottomNav.home, Icon: HomeIcon, exact: true },
    { href: `/${locale}/dashboard/favorites`, label: dict.bottomNav.favorites, Icon: HeartIcon },
    { href: `/${locale}/dashboard/orders`, label: dict.bottomNav.orders, Icon: BagIcon },
    { href: `/${locale}/dashboard/notifications`, label: dict.bottomNav.notifications, Icon: BellIcon },
    { href: `/${locale}/help`, label: dict.bottomNav.support, Icon: SupportIcon },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="size-[22px]" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
