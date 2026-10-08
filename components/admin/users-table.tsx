"use client";

import { useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Currency } from "@/lib/data/catalog";
import { formatCents, formatUsd, cn } from "@/lib/utils";
import { SearchIcon } from "@/components/ui/icons";
import { UserDetailModal } from "@/components/admin/user-detail-modal";

export type UserRow = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  walletBalance: number;
  gsmWalletBalance: number;
  createdAt: string; // ISO
};

type Labels = {
  orderStatus: Record<string, string>;
  subStatus: Record<string, string>;
  txType: Record<string, string>;
};

export function UsersTable({
  locale,
  dict,
  confirm,
  roles,
  currency,
  labels,
  users,
  adminId,
  query,
  total,
  page,
  perPage,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["users"];
  confirm: Dictionary["admin"]["confirm"];
  roles: Record<string, string>;
  currency: Currency;
  labels: Labels;
  users: UserRow[];
  adminId: string;
  /** Active search term — the rows above are already filtered by it on the
   * server, so every registered customer is reachable, not just a page. */
  query: string;
  total: number;
  page: number;
  perPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced so each keystroke doesn't fire its own query. The input stays
  // uncontrolled (seeded from the URL via `key`), so there's no local copy of
  // the search term to keep in sync with the server's.
  function onSearchChange(value: string) {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      startTransition(() => {
        router.replace(params.toString() ? `${pathname}?${params}` : pathname);
      });
    }, 350);
  }

  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    return params.toString() ? `${pathname}?${params}` : pathname;
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted ltr:left-3 rtl:right-3" />
          <input
            key={query}
            type="search"
            defaultValue={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-surface-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9"
          />
        </div>
        <span className={cn("text-xs font-semibold text-muted", pending && "opacity-50")}>
          {dict.totalCount.replace("{count}", String(total))}
        </span>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {query ? dict.noResults : dict.none}
        </div>
      ) : (
        <div className={cn("overflow-x-auto rounded-2xl border border-border bg-surface", pending && "opacity-60")}>
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="border-b border-border text-start text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3 text-start">{dict.name}</th>
                <th className="p-3 text-start">{dict.contact}</th>
                <th className="p-3 text-start">{dict.role}</th>
                <th className="p-3 text-start">{dict.wallet}</th>
                <th className="p-3 text-start">{dict.gsmWallet}</th>
                <th className="p-3 text-start">{dict.joined}</th>
                <th className="p-3 text-end">{dict.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <p className="font-bold">{user.name ?? "—"}</p>
                    {user.username && <p className="text-xs text-muted">@{user.username}</p>}
                    <p className="font-mono text-[10px] text-muted">{user.id}</p>
                  </td>
                  <td className="p-3 text-muted">{user.email}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        user.role === "ADMIN"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-2 text-muted",
                      )}
                    >
                      {roles[user.role]}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">
                    {formatCents(user.walletBalance, currency.symbol, currency.rate, locale)}
                  </td>
                  <td className="p-3 font-semibold">{formatUsd(user.gsmWalletBalance, locale)}</td>
                  <td className="p-3 text-muted">
                    {new Date(user.createdAt).toLocaleDateString(
                      locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
                    )}
                  </td>
                  <td className="p-3 text-end">
                    <UserDetailModal
                      locale={locale}
                      dict={dict}
                      confirm={confirm}
                      currency={currency}
                      labels={labels}
                      user={{ id: user.id, isSelf: user.id === adminId }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <PageLink href={pageHref(page - 1)} disabled={page <= 1}>
            ‹
          </PageLink>
          <span className="text-xs font-bold text-muted">
            {dict.pageOf.replace("{page}", String(page)).replace("{pages}", String(pageCount))}
          </span>
          <PageLink href={pageHref(page + 1)} disabled={page >= pageCount}>
            ›
          </PageLink>
        </div>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="grid size-9 place-items-center rounded-lg border border-border text-sm font-bold text-muted opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="grid size-9 place-items-center rounded-lg border border-border text-sm font-bold transition-colors hover:bg-surface-2"
    >
      {children}
    </Link>
  );
}
