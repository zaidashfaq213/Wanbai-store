"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createBankAccount, type AdminState } from "@/lib/actions/admin";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";

export function BankCreateForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["banks"];
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createBankAccount,
    { ok: false },
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold">{dict.add}</h3>
        {state.ok && state.code === "saved" && (
          <span className="text-sm font-bold text-emerald-500">{dict.saved}</span>
        )}
        {!state.ok && state.code && (
          <span className="text-sm font-bold text-red-500">{dict.invalid}</span>
        )}
      </div>
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.key}</span>
          <input name="key" required pattern="[a-z0-9-]+" placeholder="e.g. o-cash" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.color}</span>
          <input name="color" placeholder="#1c8a5a" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.nameEn ?? "Name (EN)"}</span>
          <input name="nameEn" required placeholder="O-Cash" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.nameAr ?? "Name (AR)"}</span>
          <input name="nameAr" required dir="rtl" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.accountName}</span>
          <input name="accountName" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.accountNumber}</span>
          <input name="accountNumber" required className={FIELD} />
        </label>
      </div>
      <button type="submit" disabled={pending} className="self-start rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {dict.add}
      </button>
    </form>
  );
}
