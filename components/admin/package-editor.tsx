"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  updatePackage,
  addPackage,
  deletePackage,
  type CatalogState,
} from "@/lib/actions/catalog";

const FIELD =
  "h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-sm outline-none focus:border-primary/50";

export type PkgGroup = {
  id: string;
  nameEn: string;
  nameAr: string;
  packages: Array<{ id: string; labelEn: string; labelAr: string; priceUsd: number; popular: boolean }>;
};

function PackageRow({
  locale,
  dict,
  productId,
  pkg,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  productId: string;
  pkg: PkgGroup["packages"][number];
}) {
  const [state, action, pending] = useActionState<CatalogState, FormData>(updatePackage, { ok: false });
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-2.5">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="id" value={pkg.id} />
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.labelEn}</span>
          <input name="labelEn" defaultValue={pkg.labelEn} className={`${FIELD} w-32`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.labelAr}</span>
          <input name="labelAr" defaultValue={pkg.labelAr} dir="rtl" className={`${FIELD} w-32`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.pkgPrice}</span>
          <input name="priceUsd" type="number" step="0.01" min="0" defaultValue={pkg.priceUsd} className={`${FIELD} w-24`} />
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs font-semibold">
          <input type="checkbox" name="popular" defaultChecked={pkg.popular} className="size-3.5 accent-[var(--color-primary)]" />
          {dict.popular}
        </label>
        <button type="submit" disabled={pending} className="h-9 rounded-lg brand-gradient px-3 text-xs font-bold text-white disabled:opacity-60">
          {dict.save}
        </button>
        {state.ok && state.code === "saved" && <span className="pb-2 text-xs font-bold text-emerald-500">✓</span>}
      </form>
      <form action={deletePackage}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="id" value={pkg.id} />
        <input type="hidden" name="productId" value={productId} />
        <button type="submit" className="h-9 rounded-lg border border-border px-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10">
          ✕
        </button>
      </form>
    </div>
  );
}

export function PackageEditor({
  locale,
  dict,
  productId,
  groups,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  productId: string;
  groups: PkgGroup[];
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-extrabold">{dict.pricing}</h3>
      {groups.map((g) => (
        <div key={g.id} className="flex flex-col gap-2">
          <p className="text-sm font-bold text-muted">
            {locale === "ar" ? g.nameAr : g.nameEn}
          </p>
          {g.packages.map((pkg) => (
            <PackageRow key={pkg.id} locale={locale} dict={dict} productId={productId} pkg={pkg} />
          ))}
          <form action={addPackage}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="variantGroupId" value={g.id} />
            <button type="submit" className="rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-2">
              + {dict.addPackage}
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
