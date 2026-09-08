"use client";

import { useMemo, useState } from "react";
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
}: {
  locale: Locale;
  dict: Dictionary["admin"]["users"];
  confirm: Dictionary["admin"]["confirm"];
  roles: Record<string, string>;
  currency: Currency;
  labels: Labels;
  users: UserRow[];
  adminId: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.username, u.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [users, query]);

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 -translate-y-1/2 size-4 text-muted ltr:left-3 rtl:right-3" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="h-10 w-full rounded-xl border border-border bg-surface-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {query ? dict.noResults : dict.none}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
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
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <p className="font-bold">{user.name ?? "—"}</p>
                    {user.username && <p className="text-xs text-muted">@{user.username}</p>}
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
    </div>
  );
}
