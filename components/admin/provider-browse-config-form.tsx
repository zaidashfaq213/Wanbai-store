"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  updateProviderBrowseConfig,
  type ApiProviderState,
} from "@/lib/actions/api-providers";

const FIELD =
  "h-9 w-full rounded-lg border border-border bg-surface-2 px-2.5 text-xs outline-none focus:border-primary/50";

export type BrowseConfig = {
  listEndpoint: string | null;
  listMethod: string;
  itemsPath: string | null;
  itemIdField: string;
  itemNameField: string;
  itemImageField: string | null;
  catalogueEndpoint: string | null;
  catalogueMethod: string;
  catalogueItemsPath: string | null;
  catalogueIdField: string;
  catalogueNameField: string;
  catalogueAmountField: string;
};

export function ProviderBrowseConfigForm({
  locale,
  dict,
  providerId,
  providerKey,
  config,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["apiProviders"];
  providerId: string;
  providerKey: string;
  config: BrowseConfig;
}) {
  const [state, action, pending] = useActionState<ApiProviderState, FormData>(
    updateProviderBrowseConfig,
    { ok: false },
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <input type="hidden" name="id" value={providerId} />
      <input type="hidden" name="key" value={providerKey} />
      <input type="hidden" name="locale" value={locale} />

      <div>
        <h3 className="font-extrabold">{dict.configTitle}</h3>
        <p className="mt-0.5 text-xs text-muted">{dict.configHint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.listEndpoint}</span>
          <input
            name="listEndpoint"
            defaultValue={config.listEndpoint ?? ""}
            placeholder={dict.listEndpointPlaceholder}
            dir="ltr"
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.listMethod}</span>
          <select name="listMethod" defaultValue={config.listMethod} className={FIELD}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.itemsPath}</span>
          <input name="itemsPath" defaultValue={config.itemsPath ?? ""} dir="ltr" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.itemIdField}</span>
          <input name="itemIdField" defaultValue={config.itemIdField} dir="ltr" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.itemNameField}</span>
          <input name="itemNameField" defaultValue={config.itemNameField} dir="ltr" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.itemImageField}</span>
          <input
            name="itemImageField"
            defaultValue={config.itemImageField ?? ""}
            dir="ltr"
            className={FIELD}
          />
        </label>
      </div>

      <div className="mt-2 border-t border-border pt-3">
        <h4 className="text-sm font-bold">{dict.catalogueSection}</h4>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.catalogueEndpoint}</span>
          <input
            name="catalogueEndpoint"
            defaultValue={config.catalogueEndpoint ?? ""}
            placeholder={dict.catalogueEndpointPlaceholder}
            dir="ltr"
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.catalogueMethod}</span>
          <select name="catalogueMethod" defaultValue={config.catalogueMethod} className={FIELD}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.catalogueItemsPath}</span>
          <input
            name="catalogueItemsPath"
            defaultValue={config.catalogueItemsPath ?? ""}
            dir="ltr"
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.catalogueIdField}</span>
          <input name="catalogueIdField" defaultValue={config.catalogueIdField} dir="ltr" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.catalogueNameField}</span>
          <input
            name="catalogueNameField"
            defaultValue={config.catalogueNameField}
            dir="ltr"
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.catalogueAmountField}</span>
          <input
            name="catalogueAmountField"
            defaultValue={config.catalogueAmountField}
            dir="ltr"
            className={FIELD}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {dict.saveConfig}
        </button>
        {state.ok && state.code === "saved" && (
          <span className="text-sm font-bold text-emerald-500">{dict.configSaved}</span>
        )}
        {!state.ok && state.code && (
          <span className="text-sm font-bold text-red-500">{dict.invalid}</span>
        )}
      </div>
    </form>
  );
}
