"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createApiProvider, type ApiProviderState } from "@/lib/actions/api-providers";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";
const AUTH_METHODS = ["API_KEY_HEADER", "BEARER_TOKEN", "BASIC_AUTH", "QUERY_PARAM"] as const;

export function ApiProviderCreateForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["apiProviders"];
}) {
  const [state, action, pending] = useActionState<ApiProviderState, FormData>(
    createApiProvider,
    { ok: false },
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold">{dict.add}</h3>
        {state.ok && state.code === "created" && (
          <span className="text-sm font-bold text-emerald-500">{dict.saved}</span>
        )}
        {!state.ok && state.code && (
          <span className="text-sm font-bold text-red-500">
            {state.code === "key_taken" ? dict.keyTaken : dict.invalid}
          </span>
        )}
      </div>
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.key}</span>
          <input name="key" required pattern="[a-z0-9\-]+" placeholder="e.g. myprovider" dir="ltr" className={FIELD} />
          <span className="text-[11px] text-muted">{dict.keyHint}</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.name}</span>
          <input name="name" required placeholder="My Provider" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.baseUrl}</span>
          <input name="baseUrl" required placeholder="https://api.example.com/v1" dir="ltr" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.apiKey}</span>
          <input name="apiKey" type="password" dir="ltr" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.authMethod}</span>
          <select name="authMethod" defaultValue="API_KEY_HEADER" className={FIELD}>
            {AUTH_METHODS.map((m) => (
              <option key={m} value={m}>
                {dict.authMethods[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.authHeaderName}</span>
          <input name="authHeaderName" placeholder={dict.authHeaderNamePlaceholder} dir="ltr" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.testPath}</span>
          <input name="testPath" placeholder="/games" dir="ltr" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.webhookSecret}</span>
          <input name="webhookSecret" placeholder="auto-generated if left blank" dir="ltr" className={FIELD} />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {dict.add}
      </button>
    </form>
  );
}
