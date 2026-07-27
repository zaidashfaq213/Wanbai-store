"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  addProductInput,
  updateProductInput,
  deleteProductInput,
  type CatalogState,
} from "@/lib/actions/catalog";
import { ConfirmButton } from "@/components/ui/confirm-button";

type Dict = Dictionary["admin"]["catalog"]["products"]["inputs"];
type Errors = Dictionary["admin"]["catalog"]["errors"];
type Confirm = Dictionary["admin"]["confirm"];

const FIELD =
  "h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-sm outline-none focus:border-primary/50";

export type ProductInputRow = {
  id: string;
  key: string;
  labelEn: string;
  labelAr: string;
  placeholderEn: string;
  placeholderAr: string;
  kind: string;
  required: boolean;
};

function StateBadge({ state, errors }: { state: CatalogState; errors: Errors }) {
  if (state.ok && state.code === "saved") {
    return <span className="pb-2 text-xs font-bold text-emerald-500">✓</span>;
  }
  if (!state.ok && state.code) {
    return (
      <span className="pb-2 text-xs font-bold text-red-500">
        {(errors as Record<string, string>)[state.code] ?? errors.invalid_input}
      </span>
    );
  }
  return null;
}

function InputRow({
  locale,
  dict,
  errors,
  confirm,
  productId,
  row,
}: {
  locale: Locale;
  dict: Dict;
  errors: Errors;
  confirm: Confirm;
  productId: string;
  row: ProductInputRow;
}) {
  const [state, action, pending] = useActionState<CatalogState, FormData>(updateProductInput, { ok: false });
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-2.5">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="productId" value={productId} />
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.key}</span>
          <input name="key" defaultValue={row.key} className={`${FIELD} w-28`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.labelEn}</span>
          <input name="labelEn" defaultValue={row.labelEn} className={`${FIELD} w-32`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.labelAr}</span>
          <input name="labelAr" defaultValue={row.labelAr} dir="rtl" className={`${FIELD} w-32`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.placeholderEn}</span>
          <input name="placeholderEn" defaultValue={row.placeholderEn} className={`${FIELD} w-32`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.placeholderAr}</span>
          <input name="placeholderAr" defaultValue={row.placeholderAr} dir="rtl" className={`${FIELD} w-32`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.kind}</span>
          <select name="kind" defaultValue={row.kind} className={`${FIELD} w-24`}>
            <option value="text">{dict.kindText}</option>
            <option value="number">{dict.kindNumber}</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs font-semibold">
          <input type="checkbox" name="required" defaultChecked={row.required} className="size-3.5 accent-[var(--color-primary)]" />
          {dict.required}
        </label>
        <button type="submit" disabled={pending} className="h-9 rounded-lg brand-gradient px-3 text-xs font-bold text-white disabled:opacity-60">
          {dict.save}
        </button>
        <StateBadge state={state} errors={errors} />
      </form>
      <ConfirmButton
        action={deleteProductInput}
        hidden={{ locale, id: row.id, productId }}
        title={confirm.deleteTitle}
        body={confirm.deleteBody}
        confirmText={confirm.yes}
        cancelText={confirm.no}
        className="h-9 rounded-lg border border-border px-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10"
      >
        ✕
      </ConfirmButton>
    </div>
  );
}

function AddInputForm({
  locale,
  dict,
  errors,
  productId,
}: {
  locale: Locale;
  dict: Dict;
  errors: Errors;
  productId: string;
}) {
  const [state, action, pending] = useActionState<CatalogState, FormData>(addProductInput, { ok: false });
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-2.5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productId" value={productId} />
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted">{dict.key}</span>
        <input name="key" placeholder="email" className={`${FIELD} w-28`} title={dict.keyHint} />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted">{dict.labelEn}</span>
        <input name="labelEn" placeholder="Email" className={`${FIELD} w-32`} />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted">{dict.labelAr}</span>
        <input name="labelAr" placeholder="البريد الإلكتروني" dir="rtl" className={`${FIELD} w-32`} />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted">{dict.placeholderEn}</span>
        <input name="placeholderEn" placeholder="Enter your email" className={`${FIELD} w-32`} />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted">{dict.placeholderAr}</span>
        <input name="placeholderAr" placeholder="أدخل بريدك الإلكتروني" dir="rtl" className={`${FIELD} w-32`} />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted">{dict.kind}</span>
        <select name="kind" defaultValue="text" className={`${FIELD} w-24`}>
          <option value="text">{dict.kindText}</option>
          <option value="number">{dict.kindNumber}</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5 pb-1.5 text-xs font-semibold">
        <input type="checkbox" name="required" defaultChecked className="size-3.5 accent-[var(--color-primary)]" />
        {dict.required}
      </label>
      <button type="submit" disabled={pending} className="h-9 rounded-lg brand-gradient px-3 text-xs font-bold text-white disabled:opacity-60">
        + {dict.add}
      </button>
      <StateBadge state={state} errors={errors} />
    </form>
  );
}

export function ProductInputsEditor({
  locale,
  dict,
  errors,
  confirm,
  productId,
  rows,
}: {
  locale: Locale;
  dict: Dict;
  errors: Errors;
  confirm: Confirm;
  productId: string;
  rows: ProductInputRow[];
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h3 className="font-extrabold">{dict.title}</h3>
        <p className="mt-0.5 text-xs text-muted">{dict.subtitle}</p>
      </div>
      {rows.length === 0 && <p className="text-sm text-muted">{dict.none}</p>}
      {rows.map((row) => (
        <InputRow key={row.id} locale={locale} dict={dict} errors={errors} confirm={confirm} productId={productId} row={row} />
      ))}
      <AddInputForm locale={locale} dict={dict} errors={errors} productId={productId} />
    </div>
  );
}
