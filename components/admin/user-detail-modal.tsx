"use client";

import { useActionState, useState, useTransition } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Currency } from "@/lib/data/catalog";
import {
  getUserDetail,
  adjustWallet,
  deleteUser,
  setUserRole,
  type UserDetail,
  type AdminState,
} from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { formatCents, cn } from "@/lib/utils";

type Labels = {
  orderStatus: Record<string, string>;
  subStatus: Record<string, string>;
  txType: Record<string, string>;
};

const STATUS_TINT: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  DELIVERED: "bg-emerald-500/10 text-emerald-500",
  APPROVED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
  FAILED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-fuchsia-500/10 text-fuchsia-500",
  CANCELLED: "bg-muted/10 text-muted",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-extrabold">{title}</h4>
      {children}
    </div>
  );
}

export function UserDetailModal({
  locale,
  dict,
  confirm,
  currency,
  labels,
  user,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["users"];
  confirm: Dictionary["admin"]["confirm"];
  currency: Currency;
  labels: Labels;
  user: { id: string; isSelf: boolean };
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, startLoad] = useTransition();
  const [adjustState, adjustAction, adjusting] = useActionState<AdminState, FormData>(
    adjustWallet,
    { ok: false },
  );

  const d = dict.detail;
  const money = (c: number) => formatCents(c, currency.symbol, currency.rate, locale);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");

  function view() {
    setOpen(true);
    startLoad(async () => setData(await getUserDetail(user.id)));
  }

  return (
    <>
      <button
        type="button"
        onClick={view}
        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-surface-2"
      >
        {d.view}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)]">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <p className="text-lg font-black">{data?.name ?? "—"}</p>
                <p className="text-sm text-muted">
                  {data?.username ? `@${data.username} · ` : ""}
                  {data?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg border border-border text-muted hover:bg-surface-2"
              >
                ✕
              </button>
            </div>

            {loading || !data ? (
              <div className="p-10 text-center text-sm text-muted">{d.loading}</div>
            ) : (
              <div className="flex flex-col gap-5 p-5">
                {/* Profile chips */}
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-surface-2 px-2.5 py-1">
                    {dict.role}: {data.role}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-1", data.verified ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                    {data.verified ? d.verified : d.unverified}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1">
                    {d.joined}: {fmtDate(data.createdAt)}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1">
                    {d.favorites}: {data.favoritesCount}
                  </span>
                </div>

                {/* Wallet + adjust */}
                <Section title={d.wallet}>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 p-3">
                    <span className="text-lg font-black text-primary">{money(data.walletBalance)}</span>
                    <form action={adjustAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="userId" value={user.id} />
                      <input name="amountUsd" type="number" step="0.01" placeholder={d.amount} required className="h-9 w-28 rounded-lg border border-border bg-surface px-2.5 text-sm outline-none focus:border-primary/50" />
                      <input name="reason" placeholder={dict.reason} className="h-9 w-32 rounded-lg border border-border bg-surface px-2.5 text-sm outline-none focus:border-primary/50" />
                      <button type="submit" disabled={adjusting} className="h-9 rounded-lg brand-gradient px-3 text-xs font-bold text-white disabled:opacity-60">
                        {dict.apply}
                      </button>
                      {adjustState.ok && adjustState.code === "saved" && (
                        <span className="pb-2 text-xs font-bold text-emerald-500">✓</span>
                      )}
                    </form>
                  </div>
                </Section>

                {/* Role & access */}
                {!user.isSelf && (
                  <Section title={dict.setRole}>
                    <div className="flex flex-wrap gap-2">
                      {([
                        ["USER", dict.roleUser],
                        ["MANAGER", dict.roleManager],
                        ["ADMIN", dict.roleSupervisor],
                      ] as const).map(([value, label]) => {
                        const active = data.role === value;
                        return (
                          <form key={value} action={setUserRole}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="role" value={value} />
                            <button
                              type="submit"
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                                active
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:bg-surface-2",
                              )}
                            >
                              {label}
                            </button>
                          </form>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-muted">{dict.roleHint}</p>
                  </Section>
                )}

                {/* Orders */}
                <Section title={`${d.orders} (${data.orders.length})`}>
                  {data.orders.length === 0 ? (
                    <p className="text-sm text-muted">{d.noOrders}</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {data.orders.map((o) => (
                        <li key={o.ref} className="rounded-xl border border-border p-2.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold">{o.ref}</span>
                            <span className="flex items-center gap-2">
                              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", STATUS_TINT[o.status])}>
                                {labels.orderStatus[o.status] ?? o.status}
                              </span>
                              <span className="font-black text-primary">{money(o.total)}</span>
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {o.items.map((it) => `${it.productName} · ${it.packageLabel}`).join(", ")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* Payment submissions */}
                <Section title={`${d.submissions} (${data.submissions.length})`}>
                  {data.submissions.length === 0 ? (
                    <p className="text-sm text-muted">{d.noSubmissions}</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {data.submissions.map((s, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5 text-sm">
                          <span className="font-semibold">{money(s.amount)} · {s.bankName}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", STATUS_TINT[s.status])}>
                            {labels.subStatus[s.status] ?? s.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* Wallet transactions */}
                <Section title={d.transactions}>
                  {data.transactions.length === 0 ? (
                    <p className="text-sm text-muted">{d.noTransactions}</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {data.transactions.map((t, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-muted">
                            {labels.txType[t.type] ?? t.type}
                            {t.description ? ` · ${t.description}` : ""}
                          </span>
                          <span className={cn("font-bold", t.amount >= 0 ? "text-emerald-500" : "text-red-500")}>
                            {t.amount >= 0 ? "+" : "−"}{money(Math.abs(t.amount))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* Delete */}
                {!user.isSelf && (
                  <div className="border-t border-border pt-4">
                    <ConfirmButton
                      action={deleteUser}
                      hidden={{ locale, userId: user.id }}
                      title={confirm.deleteTitle}
                      body={confirm.deleteBody}
                      confirmText={confirm.yes}
                      cancelText={confirm.no}
                      className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10"
                    >
                      {dict.delete}
                    </ConfirmButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
