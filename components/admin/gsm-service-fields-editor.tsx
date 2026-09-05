"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { addGsmServiceField, deleteGsmServiceField, type GsmState } from "@/lib/actions/gsm-admin";
import { ConfirmButton } from "@/components/ui/confirm-button";

type Dict = Dictionary["admin"]["gsm"]["services"]["fields"];
type Errors = Dictionary["admin"]["gsm"]["errors"];
type Confirm = Dictionary["admin"]["confirm"];

const FIELD =
  "h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-sm outline-none focus:border-primary/50";

export type GsmFieldRow = {
  id: string;
  key: string;
  labelEn: string;
  labelAr: string;
  kind: string;
  required: boolean;
};

const KIND_LABEL: Record<string, keyof Dict> = { text: "kindText", number: "kindNumber", file: "kindFile" };

export function GsmServiceFieldsEditor({
  locale,
  dict,
  errors,
  confirm,
  serviceId,
  rows,
}: {
  locale: Locale;
  dict: Dict;
  errors: Errors;
  confirm: Confirm;
  serviceId: string;
  rows: GsmFieldRow[];
}) {
  const [state, action, pending] = useActionState<GsmState, FormData>(addGsmServiceField, { ok: false });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h3 className="font-extrabold">{dict.title}</h3>
        <p className="mt-0.5 text-xs text-muted">{dict.subtitle}</p>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted">{dict.none}</p>}
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 p-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold">
              {row.labelEn} <span className="font-normal text-muted">/ {row.labelAr}</span>
            </span>
            <span className="text-[11px] text-muted">
              {row.key} · {dict[KIND_LABEL[row.kind] ?? "kindText"]}
              {row.required ? ` · ${dict.required}` : ""}
            </span>
          </div>
          <ConfirmButton
            action={deleteGsmServiceField}
            hidden={{ id: row.id, serviceId, locale }}
            title={confirm.deleteTitle}
            body={confirm.deleteBody}
            confirmText={confirm.yes}
            cancelText={confirm.no}
            className="h-9 rounded-lg border border-border px-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10"
          >
            ✕
          </ConfirmButton>
        </div>
      ))}

      <form action={action} className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-2.5">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.key}</span>
          <input name="key" placeholder="imei" className={`${FIELD} w-28`} title={dict.keyHint} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.labelEn}</span>
          <input name="labelEn" placeholder="IMEI number" className={`${FIELD} w-32`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.labelAr}</span>
          <input name="labelAr" placeholder="رقم IMEI" dir="rtl" className={`${FIELD} w-32`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.placeholderEn}</span>
          <input name="placeholderEn" className={`${FIELD} w-28`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.placeholderAr}</span>
          <input name="placeholderAr" dir="rtl" className={`${FIELD} w-28`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.kind}</span>
          <select name="kind" defaultValue="text" className={`${FIELD} w-24`}>
            <option value="text">{dict.kindText}</option>
            <option value="number">{dict.kindNumber}</option>
            <option value="file">{dict.kindFile}</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs font-semibold">
          <input type="checkbox" name="required" defaultChecked className="size-3.5 accent-[var(--color-primary)]" />
          {dict.required}
        </label>
        <button type="submit" disabled={pending} className="h-9 rounded-lg brand-gradient px-3 text-xs font-bold text-white disabled:opacity-60">
          + {dict.add}
        </button>
        {state.ok && state.code === "saved" && <span className="pb-2 text-xs font-bold text-emerald-500">✓</span>}
        {!state.ok && state.code && (
          <span className="pb-2 text-xs font-bold text-red-500">
            {(errors as Record<string, string>)[state.code] ?? errors.invalid_input}
          </span>
        )}
      </form>
    </div>
  );
}
