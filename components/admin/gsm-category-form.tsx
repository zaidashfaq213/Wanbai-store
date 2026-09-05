"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  createGsmCategory,
  updateGsmCategory,
  deleteGsmCategory,
  type GsmState,
} from "@/lib/actions/gsm-admin";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { slugify } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";

export type GsmCategoryRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  servicesCount: number;
};

export function GsmCategoryForm({
  locale,
  dict,
  confirm,
  errors,
  category,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gsm"]["categories"];
  confirm: Dictionary["admin"]["confirm"];
  errors: Dictionary["admin"]["gsm"]["errors"];
  category?: GsmCategoryRow;
}) {
  const isEdit = Boolean(category);
  const [state, action, pending] = useActionState<GsmState, FormData>(
    isEdit ? updateGsmCategory : createGsmCategory,
    { ok: false },
  );
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="locale" value={locale} />
      {category && <input type="hidden" name="id" value={category.id} />}

      <div className="flex items-center justify-between">
        <p className="font-bold">
          {category ? (
            <>
              <span className="text-xl">{category.icon}</span> {category.nameEn}
              <span className="ms-2 text-xs font-normal text-muted">
                {category.servicesCount} {dict.servicesCount}
              </span>
            </>
          ) : (
            dict.add
          )}
        </p>
        {state.ok && state.code === "saved" && (
          <span className="text-sm font-bold text-emerald-500">{dict.saved}</span>
        )}
        {!state.ok && state.code && (
          <span className="text-sm font-bold text-red-500">
            {(errors as Record<string, string>)[state.code] ?? errors.invalid_input}
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {!isEdit && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.slug}</span>
            <input
              name="slug"
              required
              pattern="[a-z0-9\-]+"
              placeholder="e.g. network-unlock"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className={FIELD}
            />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.icon}</span>
          <input name="icon" defaultValue={category?.icon ?? "📱"} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.nameEn}</span>
          <input
            name="nameEn"
            defaultValue={category?.nameEn ?? ""}
            required
            className={FIELD}
            onChange={(e) => {
              if (!isEdit && !slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.nameAr}</span>
          <input name="nameAr" defaultValue={category?.nameAr ?? ""} dir="rtl" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.order}</span>
          <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className={FIELD} />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={category?.active ?? true} className="size-4 accent-[var(--color-primary)]" />
          {dict.active}
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {dict.save}
        </button>
        {category && category.servicesCount === 0 && (
          <ConfirmButton
            action={deleteGsmCategory}
            hidden={{ id: category.id, locale }}
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
    </form>
  );
}
