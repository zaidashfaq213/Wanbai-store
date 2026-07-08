"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { updateBankAccount, type PaymentState } from "@/lib/actions/payments";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";

export type BankRow = {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  accountName: string;
  accountNumber: string;
  instructionsEn: string | null;
  instructionsAr: string | null;
  color: string | null;
  active: boolean;
};

export function BankEditForm({
  locale,
  dict,
  bank,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["banks"];
  bank: BankRow;
}) {
  const [state, action, pending] = useActionState<PaymentState, FormData>(
    updateBankAccount,
    { ok: false },
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="id" value={bank.id} />
      <input type="hidden" name="locale" value={locale} />

      <div className="flex items-center gap-3">
        <span
          className="grid size-10 place-items-center rounded-xl text-sm font-black text-white"
          style={{ backgroundColor: bank.color ?? "#6d28d9" }}
        >
          {bank.nameEn.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}
        </span>
        <div>
          <p className="font-bold">{locale === "ar" ? bank.nameAr : bank.nameEn}</p>
          <p className="text-xs text-muted">{bank.key}</p>
        </div>
        {state.ok && state.code === "saved" && (
          <span className="text-sm font-bold text-emerald-500 ltr:ml-auto rtl:mr-auto">
            {dict.saved}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.accountName}</span>
          <input name="accountName" defaultValue={bank.accountName} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.accountNumber}</span>
          <input name="accountNumber" defaultValue={bank.accountNumber} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.instructionsEn}</span>
          <input name="instructionsEn" defaultValue={bank.instructionsEn ?? ""} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.instructionsAr}</span>
          <input name="instructionsAr" defaultValue={bank.instructionsAr ?? ""} dir="rtl" className={FIELD} />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={bank.active} className="size-4 accent-[var(--color-primary)]" />
          {dict.active}
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {dict.save}
        </button>
      </div>
    </form>
  );
}
