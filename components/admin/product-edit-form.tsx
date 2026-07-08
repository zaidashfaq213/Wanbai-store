"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { updateProduct, deleteProduct, type CatalogState } from "@/lib/actions/catalog";

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
};

export function ProductEditForm({
  locale,
  dict,
  errors,
  fulfillments,
  product,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  errors: Dictionary["admin"]["catalog"]["errors"];
  fulfillments: Record<string, string>;
  product: ProductCore;
  categories: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState<CatalogState, FormData>(
    updateProduct,
    { ok: false },
  );

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
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-muted">{dict.image}</span>
          <input name="image" defaultValue={product.image ?? ""} className={FIELD} />
        </label>
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

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {dict.save}
        </button>
        <button
          type="submit"
          formAction={deleteProduct}
          className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10"
        >
          {dict.delete}
        </button>
      </div>
    </form>
  );
}
