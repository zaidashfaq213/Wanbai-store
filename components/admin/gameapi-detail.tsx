"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  mapCatalogueToPackage,
  syncFieldsAction,
  type GameApiState,
} from "@/lib/actions/gameapi";

const FIELD =
  "h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-xs outline-none focus:border-primary/50";

type PackageOption = { id: string; label: string; priceUsd: number };
type CatalogueRow = {
  id: string;
  name: string;
  amount: number;
  packageId: string | null;
  packagePriceUsd: number | null;
};

export function GameApiDetail({
  locale,
  dict,
  gameCode,
  product,
  packageOptions,
  catalogues,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  gameCode: string;
  product: { id: string; name: string } | null;
  packageOptions: PackageOption[];
  catalogues: CatalogueRow[];
}) {
  if (!product) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        {dict.linkFirst}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <span className="text-sm font-bold">
          {dict.linkedProduct}: {product.name}
        </span>
        <SyncFieldsButton locale={locale} dict={dict} gameCode={gameCode} productId={product.id} />
      </div>

      {catalogues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          {dict.noCatalogue}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3 text-start">{dict.catalogueName}</th>
                <th className="p-3 text-start">{dict.providerCost}</th>
                <th className="p-3 text-start">{dict.mappedPackage}</th>
                <th className="p-3 text-start">{dict.sellPrice}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {catalogues.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3 text-muted">${c.amount.toFixed(2)}</td>
                  <td className="p-3" colSpan={2}>
                    <form action={mapCatalogueToPackage} className="flex items-center gap-2">
                      <input type="hidden" name="catalogueId" value={c.id} />
                      <input type="hidden" name="gameCode" value={gameCode} />
                      <input type="hidden" name="locale" value={locale} />
                      <select name="packageId" defaultValue={c.packageId ?? ""} className={FIELD}>
                        <option value="">{dict.noneOption}</option>
                        {packageOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label} (${p.priceUsd.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold hover:bg-surface-2"
                      >
                        {dict.save}
                      </button>
                      {c.packageId && c.packagePriceUsd != null && c.packagePriceUsd < c.amount && (
                        <span className="text-xs font-bold text-red-500">{dict.belowCost}</span>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SyncFieldsButton({
  locale,
  dict,
  gameCode,
  productId,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  gameCode: string;
  productId: string;
}) {
  const [state, action, pending] = useActionState<GameApiState, FormData>(syncFieldsAction, {
    ok: false,
  });
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="gameCode" value={gameCode} />
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-surface-2 disabled:opacity-60"
      >
        {pending ? dict.syncing : dict.syncFields}
      </button>
      {state.ok && <span className="text-xs font-bold text-emerald-500">{dict.fieldsSynced}</span>}
      {!state.ok && state.code && (
        <span className="text-xs font-bold text-red-500">{dict.syncFailed}</span>
      )}
    </form>
  );
}
