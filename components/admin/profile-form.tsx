"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/lib/actions/account";

const FIELD =
  "h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-surface";

export function AdminPasswordForm({
  dict,
}: {
  dict: {
    title: string;
    subtitle: string;
    current: string;
    next: string;
    confirm: string;
    save: string;
    saved: string;
    errors: Record<string, string>;
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    changePassword,
    { ok: false },
  );

  return (
    <form
      action={action}
      className="flex max-w-md flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
    >
      <div>
        <h2 className="text-base font-bold">{dict.title}</h2>
        <p className="mt-0.5 text-xs text-muted">{dict.subtitle}</p>
      </div>

      {state.ok && state.code === "password_changed" && (
        <p className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium text-emerald-500">
          {dict.saved}
        </p>
      )}
      {!state.ok && state.code && (
        <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
          {dict.errors[state.code] ?? dict.errors.invalid_input}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.current}</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.next}</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.confirm}</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={FIELD}
        />
      </label>

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
