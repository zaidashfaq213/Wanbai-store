"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createProduct, type CatalogState } from "@/lib/actions/catalog";
import { slugify } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";

export function ProductCreateForm({
  locale,
  dict,
  errors,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  errors: Dictionary["admin"]["catalog"]["errors"];
  categories: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState<CatalogState, FormData>(
    createProduct,
    { ok: false },
  );
  // Auto-fill the slug from the English name (most admins don't know slugs
  // must be lowercase-hyphenated — typing a display name there used to trip
  // the browser's native pattern validation with a confusing popup). Once the
  // admin edits the slug field directly, stop overwriting it.
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <input type="hidden" name="locale" value={locale} />

      {!state.ok && state.code && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
          {(errors as Record<string, string>)[state.code] ?? errors.invalid_input}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.slug}</span>
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            placeholder="e.g. free-fire"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.category}</span>
          <select name="categoryId" required className={FIELD}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.name} (EN)</span>
          <input
            name="nameEn"
            required
            className={FIELD}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.name} (AR)</span>
          <input name="nameAr" required dir="rtl" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.initial}</span>
          <input name="initial" required maxLength={4} placeholder="FF" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.priceFrom}</span>
          <input name="priceFromUsd" type="number" step="0.01" min="0" required defaultValue="1" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.badgeEn}</span>
          <input name="badgeEn" defaultValue="Instant" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.badgeAr}</span>
          <input name="badgeAr" defaultValue="تسليم فوري" dir="rtl" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-muted">{dict.imageUpload}</span>
          <input
            type="file"
            name="imageFile"
            accept="image/png,image/jpeg,image/webp"
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-primary"
          />
          <span className="text-[11px] text-muted">{dict.imageUploadHint}</span>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked className="size-4 accent-[var(--color-primary)]" />
        {dict.active}
      </label>

      <p className="rounded-xl bg-primary/5 p-2.5 text-xs text-primary">{dict.createHint}</p>

      <button type="submit" disabled={pending} className="rounded-xl brand-gradient px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {dict.createSubmit}
      </button>
    </form>
  );
}
