"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { updateProduct, deleteProduct, type CatalogState } from "@/lib/actions/catalog";
import { ConfirmButton } from "@/components/ui/confirm-button";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";
const AREA =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50";

export type ProductCore = {
  id: string;
  slug: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  badgeEn: string;
  badgeAr: string;
  initial: string;
  priceFromUsd: number;
  image: string | null;
  fulfillment: "TOPUP" | "CODE" | "SERVICE";
  overviewEn: string;
  overviewAr: string;
  howToUseEn: string;
  howToUseAr: string;
  active: boolean;
  available: boolean;
};

export function ProductEditForm({
  locale,
  dict,
  confirm,
  errors,
  fulfillments,
  product,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  confirm: Dictionary["admin"]["confirm"];
  errors: Dictionary["admin"]["catalog"]["errors"];
  fulfillments: Record<string, string>;
  product: ProductCore;
  categories: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState<CatalogState, FormData>(
    updateProduct,
    { ok: false },
  );
  const [available, setAvailable] = useState(product.available);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={product.id} />

      <div className="flex items-center justify-between">
        <h3 className="font-extrabold">{dict.core}</h3>
        {state.ok && state.code === "saved" && (
          <span className="text-sm font-bold text-emerald-500">{dict.saved}</span>
        )}
        {!state.ok && state.code && (
          <span className="text-sm font-bold text-red-500">
            {(errors as Record<string, string>)[state.code] ?? errors.invalid_input}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.name} (EN)</span>
          <input name="nameEn" defaultValue={product.nameEn} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.name} (AR)</span>
          <input name="nameAr" defaultValue={product.nameAr} dir="rtl" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.category}</span>
          <select name="categoryId" defaultValue={product.categoryId} className={FIELD}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.fulfillment}</span>
          <select name="fulfillment" defaultValue={product.fulfillment} className={FIELD}>
            {(["TOPUP", "CODE", "SERVICE"] as const).map((f) => (
              <option key={f} value={f}>{fulfillments[f]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.priceFrom}</span>
          <input name="priceFromUsd" type="number" step="0.01" min="0" defaultValue={product.priceFromUsd} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.initial}</span>
          <input name="initial" defaultValue={product.initial} maxLength={4} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.badgeEn}</span>
          <input name="badgeEn" defaultValue={product.badgeEn} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.badgeAr}</span>
          <input name="badgeAr" defaultValue={product.badgeAr} dir="rtl" className={FIELD} />
        </label>
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-2 p-4 sm:col-span-2">
          <span className="text-xs font-semibold text-muted">{dict.imageUpload}</span>
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || `/products/${product.slug}.svg`}
              alt={dict.currentImage}
              className="size-16 shrink-0 rounded-xl border border-border bg-background object-contain p-1"
            />
            <div className="flex flex-1 flex-col gap-2">
              <input
                type="file"
                name="imageFile"
                accept="image/png,image/jpeg,image/webp"
                className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-primary"
              />
              <span className="text-[11px] text-muted">{dict.imageUploadHint}</span>
              {product.image && (
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <input type="checkbox" name="removeImage" />
                  {dict.delete}
                </label>
              )}
            </div>
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.overviewEn}</span>
          <textarea name="overviewEn" rows={3} defaultValue={product.overviewEn} className={AREA} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.overviewAr}</span>
          <textarea name="overviewAr" rows={3} dir="rtl" defaultValue={product.overviewAr} className={AREA} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.howToUseEn}</span>
          <textarea name="howToUseEn" rows={3} defaultValue={product.howToUseEn} className={AREA} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.howToUseAr}</span>
          <textarea name="howToUseAr" rows={3} dir="rtl" defaultValue={product.howToUseAr} className={AREA} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked={product.active} className="size-4 accent-[var(--color-primary)]" />
        {dict.active}
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted">{dict.availability}</span>
        <input type="checkbox" name="available" checked={available} readOnly hidden />
        <div className="inline-flex w-fit overflow-hidden rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setAvailable(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors ${
              available ? "bg-emerald-500/10 text-emerald-500" : "text-muted hover:bg-surface-2"
            }`}
          >
            🟢 {dict.available}
          </button>
          <button
            type="button"
            onClick={() => setAvailable(false)}
            className={`flex items-center gap-1.5 border-s border-border px-4 py-2 text-sm font-bold transition-colors ${
              !available ? "bg-red-500/10 text-red-500" : "text-muted hover:bg-surface-2"
            }`}
          >
            🔴 {dict.unavailable}
          </button>
        </div>
        <span className="text-[11px] text-muted">{dict.availabilityHint}</span>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {dict.save}
        </button>
        <ConfirmButton
          action={deleteProduct}
          hidden={{ id: product.id, locale }}
          title={confirm.deleteTitle}
          body={confirm.deleteBody}
          confirmText={confirm.yes}
          cancelText={confirm.no}
          className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10"
        >
          {dict.delete}
        </ConfirmButton>
      </div>
    </form>
  );
}
