"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { topUpWallet, type TopUpState } from "@/lib/actions/account";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 25, 50];

export function WalletTopUp({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary["dashboard"]["wallet"];
}) {
  const [amount, setAmount] = useState("10");
  const [state, action, pending] = useActionState<TopUpState, FormData>(
    topUpWallet,
    { ok: false },
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="locale" value={locale} />
      <p className="text-sm font-bold">{dict.topUp}</p>

      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            className={cn(
              "rounded-xl border py-2 text-sm font-bold transition-colors",
              amount === String(v)
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:bg-surface-2",
            )}
          >
            ${v}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.amount}</span>
        <input
          name="amountUsd"
          type="number"
          min={1}
          max={1000}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="h-11 rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none focus:border-primary/50 focus:bg-surface"
        />
      </label>

      {state.ok && state.code === "topup_success" && (
        <p className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium text-emerald-500">
          {dict.topUpSuccess}
        </p>
      )}
      {!state.ok && state.code && (
        <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
          {dict.topUpError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl brand-gradient py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {dict.add}
      </button>
      <p className="text-center text-[11px] text-muted">{dict.mockNote}</p>
    </form>
  );
}
