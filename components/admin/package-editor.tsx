"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  updatePackage,
  addPackage,
  deletePackage,
  addVariantGroup,
  updateVariantGroup,
  deleteVariantGroup,
  type CatalogState,
} from "@/lib/actions/catalog";
import { ConfirmButton } from "@/components/ui/confirm-button";

type Confirm = Dictionary["admin"]["confirm"];

const FIELD =
  "h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-sm outline-none focus:border-primary/50";

export type PkgGroup = {
  id: string;
  nameEn: string;
  nameAr: string;
  packages: Array<{
    id: string;
    labelEn: string;
    labelAr: string;
    priceUsd: number;
    compareAtPriceUsd: number | null;
    compareAtEnabled: boolean;
    popular: boolean;
  }>;
};

function PackageRow({
  locale,
  dict,
  confirm,
  productId,
  pkg,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  confirm: Confirm;
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
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.compareAtPrice}</span>
          <input
            name="compareAtPriceUsd"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pkg.compareAtPriceUsd ?? ""}
            placeholder="—"
            className={`${FIELD} w-24`}
          />
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs font-semibold">
          <input
            type="checkbox"
            name="compareAtEnabled"
            defaultChecked={pkg.compareAtEnabled}
            className="size-3.5 accent-[var(--color-primary)]"
          />
          {dict.compareAtEnabled}
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
      <ConfirmButton
        action={deletePackage}
        hidden={{ locale, id: pkg.id, productId }}
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

function GroupHeader({
  locale,
  dict,
  confirm,
  productId,
  group,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  confirm: Confirm;
  productId: string;
  group: PkgGroup;
}) {
  const [state, action, pending] = useActionState<CatalogState, FormData>(updateVariantGroup, { ok: false });
  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border pb-2">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="id" value={group.id} />
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.groupNameEn}</span>
          <input name="nameEn" defaultValue={group.nameEn} className={`${FIELD} w-36`} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted">{dict.groupNameAr}</span>
          <input name="nameAr" defaultValue={group.nameAr} dir="rtl" className={`${FIELD} w-36`} />
        </label>
        <button type="submit" disabled={pending} className="h-9 rounded-lg border border-border px-3 text-xs font-bold hover:bg-surface-2 disabled:opacity-60">
          {dict.renameGroup}
        </button>
        {state.ok && state.code === "saved" && <span className="pb-2 text-xs font-bold text-emerald-500">✓</span>}
      </form>
      <ConfirmButton
        action={deleteVariantGroup}
        hidden={{ locale, id: group.id, productId }}
        title={confirm.deleteTitle}
        body={confirm.deleteBody}
        confirmText={confirm.yes}
        cancelText={confirm.no}
        className="h-9 rounded-lg border border-border px-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10"
      >
        {dict.deleteGroup}
      </ConfirmButton>
    </div>
  );
}

function AddGroupForm({
  locale,
  dict,
  productId,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  productId: string;
}) {
  return (
    <form action={addVariantGroup} className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-2.5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productId" value={productId} />
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted">{dict.groupNameEn}</span>
        <input name="nameEn" placeholder="Followers" className={`${FIELD} w-36`} />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted">{dict.groupNameAr}</span>
        <input name="nameAr" placeholder="المتابعون" dir="rtl" className={`${FIELD} w-36`} />
      </label>
      <button type="submit" className="h-9 rounded-lg brand-gradient px-3 text-xs font-bold text-white">
        + {dict.addGroup}
      </button>
    </form>
  );
}

export function PackageEditor({
  locale,
  dict,
  confirm,
  productId,
  groups,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["catalog"]["products"];
  confirm: Confirm;
  productId: string;
  groups: PkgGroup[];
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-extrabold">{dict.pricing}</h3>
      {groups.map((g) => (
        <div key={g.id} className="flex flex-col gap-2">
          <GroupHeader locale={locale} dict={dict} confirm={confirm} productId={productId} group={g} />
          {g.packages.map((pkg) => (
            <PackageRow key={pkg.id} locale={locale} dict={dict} confirm={confirm} productId={productId} pkg={pkg} />
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
      <AddGroupForm locale={locale} dict={dict} productId={productId} />
    </div>
  );
}
