"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { updateGsmService, deleteGsmService, type GsmState } from "@/lib/actions/gsm-admin";
import { ConfirmButton } from "@/components/ui/confirm-button";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";
const AREA =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50";

export type GsmServiceEditRow = {
  id: string;
  categoryId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  priceUsd: number;
  descriptionEn: string;
  descriptionAr: string;
  requirementsEn: string;
  requirementsAr: string;
  processingTimeEn: string;
  processingTimeAr: string;
  active: boolean;
};

export function GsmServiceEditForm({
  locale,
  dict,
  errors,
  confirm,
  service,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gsm"]["services"];
  errors: Dictionary["admin"]["gsm"]["errors"];
  confirm: Dictionary["admin"]["confirm"];
  service: GsmServiceEditRow;
  categories: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState<GsmState, FormData>(updateGsmService, { ok: false });

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={service.id} />

      <div className="flex items-center justify-between">
        <h3 className="font-extrabold">{dict.core}</h3>
        {state.ok && state.code === "saved" && <span className="text-sm font-bold text-emerald-500">{dict.saved}</span>}
        {!state.ok && state.code && (
          <span className="text-sm font-bold text-red-500">
            {(errors as Record<string, string>)[state.code] ?? errors.invalid_input}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.slug}</span>
          <input name="slug" defaultValue={service.slug} required pattern="[a-z0-9-]+" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.categoryLabel}</span>
          <select name="categoryId" defaultValue={service.categoryId} required className={FIELD}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.nameEn}</span>
          <input name="nameEn" defaultValue={service.nameEn} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.nameAr}</span>
          <input name="nameAr" defaultValue={service.nameAr} dir="rtl" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.priceUsd}</span>
          <input name="priceUsd" type="number" step="0.01" min="0" defaultValue={service.priceUsd} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.processingTimeEn}</span>
          <input name="processingTimeEn" defaultValue={service.processingTimeEn} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.processingTimeAr}</span>
          <input name="processingTimeAr" defaultValue={service.processingTimeAr} dir="rtl" className={FIELD} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.descriptionEn}</span>
        <textarea name="descriptionEn" rows={3} defaultValue={service.descriptionEn} className={AREA} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.descriptionAr}</span>
        <textarea name="descriptionAr" rows={3} dir="rtl" defaultValue={service.descriptionAr} className={AREA} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.requirementsEn}</span>
        <textarea name="requirementsEn" rows={3} defaultValue={service.requirementsEn} className={AREA} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.requirementsAr}</span>
        <textarea name="requirementsAr" rows={3} dir="rtl" defaultValue={service.requirementsAr} className={AREA} />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked={service.active} className="size-4 accent-[var(--color-primary)]" />
        {dict.active}
      </label>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-xl brand-gradient px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {dict.save}
        </button>
        <ConfirmButton
          action={deleteGsmService}
          hidden={{ id: service.id, locale }}
          title={confirm.deleteTitle}
          body={confirm.deleteBody}
          confirmText={confirm.yes}
          cancelText={confirm.no}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10"
        >
          {dict.delete}
        </ConfirmButton>
      </div>
    </form>
  );
}
