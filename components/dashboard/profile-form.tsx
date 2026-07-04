"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { updateProfile, type FormState } from "@/lib/actions/account";

const FIELD =
  "h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-surface";

export function ProfileForm({
  locale,
  dict,
  defaults,
  localeOptions,
  currencyOptions,
}: {
  locale: Locale;
  dict: Dictionary["dashboard"]["profile"];
  defaults: { name: string; email: string; preferredLocale: string; preferredCurrency: string };
  localeOptions: Array<{ value: string; label: string }>;
  currencyOptions: string[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProfile,
    { ok: false },
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <input type="hidden" name="locale" value={locale} />

      {state.ok && state.code === "profile_saved" && (
        <p className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium text-emerald-500">
          {dict.saved}
        </p>
      )}
      {!state.ok && state.code && (
        <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
          {dict.error}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.name}</span>
        <input name="name" type="text" defaultValue={defaults.name} required className={FIELD} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.email}</span>
        <input type="email" value={defaults.email} disabled className={`${FIELD} opacity-60`} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.language}</span>
          <select name="preferredLocale" defaultValue={defaults.preferredLocale} className={FIELD}>
            {localeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.currency}</span>
          <select name="preferredCurrency" defaultValue={defaults.preferredCurrency} className={FIELD}>
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl brand-gradient py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {dict.save}
      </button>
    </form>
  );
}
