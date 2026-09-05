"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createGsmService, type GsmState } from "@/lib/actions/gsm-admin";
import { slugify } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";
const AREA =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50";

export function GsmServiceCreateForm({
  locale,
  dict,
  errors,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gsm"]["services"];
  errors: Dictionary["admin"]["gsm"]["errors"];
  categories: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState<GsmState, FormData>(
    createGsmService,
    { ok: false },
  );
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
            placeholder="e.g. imei-unlock"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.categoryLabel}</span>
          <select name="categoryId" required className={FIELD}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.nameEn}</span>
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
          <span className="text-xs font-semibold text-muted">{dict.nameAr}</span>
          <input name="nameAr" required dir="rtl" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.priceUsd}</span>
          <input name="priceUsd" type="number" step="0.01" min="0" required defaultValue="10" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.processingTimeEn}</span>
          <input name="processingTimeEn" placeholder="1-3 business days" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.processingTimeAr}</span>
          <input name="processingTimeAr" dir="rtl" className={FIELD} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.descriptionEn}</span>
        <textarea name="descriptionEn" rows={3} className={AREA} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.descriptionAr}</span>
        <textarea name="descriptionAr" rows={3} dir="rtl" className={AREA} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.requirementsEn}</span>
        <textarea name="requirementsEn" rows={3} className={AREA} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.requirementsAr}</span>
        <textarea name="requirementsAr" rows={3} dir="rtl" className={AREA} />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked className="size-4 accent-[var(--color-primary)]" />
        {dict.active}
      </label>

      <button type="submit" disabled={pending} className="rounded-xl brand-gradient px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {dict.createSubmit}
      </button>
    </form>
  );
}
