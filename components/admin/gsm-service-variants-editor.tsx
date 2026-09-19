"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  addGsmServiceVariant,
  updateGsmServiceVariant,
  deleteGsmServiceVariant,
  type GsmState,
} from "@/lib/actions/gsm-admin";
import { ConfirmButton } from "@/components/ui/confirm-button";

type Dict = Dictionary["admin"]["gsm"]["services"]["variants"];
type Confirm = Dictionary["admin"]["confirm"];

const FIELD =
  "h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-sm outline-none focus:border-primary/50";

export type GsmVariantRow = {
  id: string;
  nameEn: string;
  nameAr: string;
  priceUsd: number;
  active: boolean;
};

function VariantRow({
  locale,
  dict,
  confirm,
  serviceId,
  variant,
}: {
  locale: Locale;
  dict: Dict;
  confirm: Confirm;
  serviceId: string;
  variant: GsmVariantRow;
}) {
  const [state, action, pending] = useActionState<GsmState, FormData>(updateGsmServiceVariant, { ok: false });
  const [active, setActive] = useState(variant.active);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface-2 p-2.5">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="id" value={variant.id} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <input type="checkbox" name="active" checked={active} readOnly hidden />
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.nameEn}</span>
          <input name="nameEn" defaultValue={variant.nameEn} className={`${FIELD} w-40`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.nameAr}</span>
          <input name="nameAr" defaultValue={variant.nameAr} dir="rtl" className={`${FIELD} w-40`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.priceUsd}</span>
          <input name="priceUsd" type="number" step="0.01" min="0" defaultValue={variant.priceUsd} className={`${FIELD} w-24`} />
        </label>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.availability}</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setActive(true)}
              className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
                active ? "bg-emerald-500/10 text-emerald-500" : "text-muted hover:bg-surface-2"
              }`}
            >
              🟢 {dict.active}
            </button>
            <button
              type="button"
              onClick={() => setActive(false)}
              className={`border-s border-border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                !active ? "bg-red-500/10 text-red-500" : "text-muted hover:bg-surface-2"
              }`}
            >
              🔴 {dict.inactive}
            </button>
          </div>
        </div>
        <button type="submit" disabled={pending} className="h-9 rounded-lg brand-gradient px-3 text-xs font-bold text-white disabled:opacity-60">
          {dict.save}
        </button>
        {state.ok && state.code === "saved" && <span className="pb-2 text-xs font-bold text-emerald-500">✓</span>}
      </form>
      <ConfirmButton
        action={deleteGsmServiceVariant}
        hidden={{ locale, id: variant.id, serviceId }}
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

// Optional priced sub-items under a GSM service (e.g. Honor/Samsung/iPhone
// under "IMEI Service") — same idea as Package under a store Product. A
// service with zero rows here keeps selling directly at its own price,
// completely unchanged — this section is purely additive.
export function GsmServiceVariantsEditor({
  locale,
  dict,
  confirm,
  serviceId,
  variants,
}: {
  locale: Locale;
  dict: Dict;
  confirm: Confirm;
  serviceId: string;
  variants: GsmVariantRow[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h3 className="font-extrabold">{dict.title}</h3>
        <p className="mt-0.5 text-xs text-muted">{dict.subtitle}</p>
      </div>

      {variants.length === 0 && <p className="text-sm text-muted">{dict.none}</p>}
      {variants.map((v) => (
        <VariantRow key={v.id} locale={locale} dict={dict} confirm={confirm} serviceId={serviceId} variant={v} />
      ))}

      <form action={addGsmServiceVariant}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <button type="submit" className="rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-2">
          + {dict.add}
        </button>
      </form>
    </div>
  );
}
