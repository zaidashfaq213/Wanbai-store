"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  updateApiProvider,
  toggleApiProviderActive,
  deleteApiProvider,
  testApiProviderConnection,
  type ApiProviderState,
} from "@/lib/actions/api-providers";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";
const AUTH_METHODS = ["API_KEY_HEADER", "BEARER_TOKEN", "BASIC_AUTH", "QUERY_PARAM"] as const;

export type ApiProviderRow = {
  id: string;
  key: string;
  name: string;
  baseUrl: string;
  hasApiKey: boolean;
  authMethod: (typeof AUTH_METHODS)[number];
  authHeaderName: string | null;
  testPath: string;
  webhookSecret: string | null;
  active: boolean;
  notes: string | null;
  connectedGames: number;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
};

export function ApiProviderCard({
  locale,
  dict,
  confirm,
  webhookBaseUrl,
  provider,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["apiProviders"];
  confirm: Dictionary["admin"]["confirm"];
  webhookBaseUrl: string;
  provider: ApiProviderRow;
}) {
  const [state, action, pending] = useActionState<ApiProviderState, FormData>(
    updateApiProvider,
    { ok: false },
  );
  const [testState, testAction, testing] = useActionState<ApiProviderState, FormData>(
    testApiProviderConnection,
    { ok: false },
  );
  const [authMethod, setAuthMethod] = useState(provider.authMethod);
  const isBuiltIn = provider.key === "g2bulk";
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black">{provider.name}</h3>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-muted">
            {provider.key}
          </span>
          {isBuiltIn && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {dict.builtIn}
            </span>
          )}
        </div>
        <form action={toggleApiProviderActive} className="flex items-center gap-2">
          <input type="hidden" name="id" value={provider.id} />
          <input type="hidden" name="locale" value={locale} />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="active"
              defaultChecked={provider.active}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="size-4 accent-[var(--color-primary)]"
            />
            {dict.active}
          </label>
        </form>
      </div>

      {!isBuiltIn && (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600">
          {dict.notIntegrated}
        </p>
      )}

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={provider.id} />
        <input type="hidden" name="locale" value={locale} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.name}</span>
            <input name="name" defaultValue={provider.name} required className={FIELD} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.baseUrl}</span>
            <input name="baseUrl" defaultValue={provider.baseUrl} required dir="ltr" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.apiKey}</span>
            <input
              name="apiKey"
              type="password"
              placeholder={dict.apiKeyPlaceholder}
              dir="ltr"
              className={FIELD}
            />
            <span className={cn("text-[11px]", provider.hasApiKey ? "text-emerald-500" : "text-amber-500")}>
              {provider.hasApiKey ? dict.apiKeySet : dict.apiKeyNotSet}
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.authMethod}</span>
            <select
              name="authMethod"
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value as typeof authMethod)}
              className={FIELD}
            >
              {AUTH_METHODS.map((m) => (
                <option key={m} value={m}>
                  {dict.authMethods[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.authHeaderName}</span>
            <input
              name="authHeaderName"
              defaultValue={provider.authHeaderName ?? ""}
              placeholder={dict.authHeaderNamePlaceholder}
              dir="ltr"
              className={FIELD}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.testPath}</span>
            <input name="testPath" defaultValue={provider.testPath} dir="ltr" className={FIELD} />
          </label>
        </div>
        <p className="text-[11px] text-muted">{dict.testPathHint}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.webhookSecret}</span>
            <input
              name="webhookSecret"
              defaultValue={provider.webhookSecret ?? ""}
              dir="ltr"
              className={cn(FIELD, "font-mono text-xs")}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.webhookUrl}</span>
            <input
              readOnly
              value={`${webhookBaseUrl}/${provider.key}`}
              dir="ltr"
              className={cn(FIELD, "font-mono text-xs text-muted")}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {dict.save}
            </button>
            {state.ok && state.code === "saved" && (
              <span className="text-sm font-bold text-emerald-500">{dict.saved}</span>
            )}
            {!state.ok && state.code && (
              <span className="text-sm font-bold text-red-500">{dict.invalid}</span>
            )}
            {!isBuiltIn && (
              <ConfirmButton
                action={deleteApiProvider}
                hidden={{ id: provider.id, locale }}
                title={confirm.deleteTitle}
                body={confirm.deleteBody}
                confirmText={confirm.yes}
                cancelText={confirm.no}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10"
              >
                {dict.delete}
              </ConfirmButton>
            )}
          </div>
          <span className="text-xs text-muted">
            {dict.connectedGames}: <span className="font-bold text-foreground">{provider.connectedGames}</span>
          </span>
        </div>
      </form>

      {/* Test connection */}
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <form action={testAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={provider.id} />
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            disabled={testing}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold hover:bg-surface-3 disabled:opacity-60"
          >
            {testing ? dict.testing : dict.testConnection}
          </button>
          {testState.code && (
            <span className={cn("text-xs font-bold", testState.ok ? "text-emerald-500" : "text-red-500")}>
              {testState.ok ? dict.testOk : dict.testFailed} — {testState.code}
            </span>
          )}
          <span className="ms-auto text-[11px] text-muted">
            {dict.lastTested}: {provider.lastTestedAt ? fmtDate(provider.lastTestedAt) : dict.neverTested}
            {provider.lastTestedAt && (
              <span className={provider.lastTestOk ? "text-emerald-500" : "text-red-500"}>
                {" "}
                ({provider.lastTestOk ? dict.testOk : dict.testFailed})
              </span>
            )}
          </span>
        </form>
      </div>

      {/* Error log */}
      {provider.lastErrorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs">
          <p className="font-bold text-red-500">
            {dict.lastError} {provider.lastErrorAt ? `(${fmtDate(provider.lastErrorAt)})` : ""}
          </p>
          <p className="mt-1 text-red-500/90">{provider.lastErrorMessage}</p>
        </div>
      )}
    </div>
  );
}
