"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { linkGameToProduct, toggleGameActive } from "@/lib/actions/gameapi";
import {
  syncProviderGamesAction,
  syncProviderCatalogueAction,
  createProductFromProviderGame,
  type GenericSyncState,
} from "@/lib/actions/api-providers";

const FIELD =
  "h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-xs outline-none focus:border-primary/50";

type Game = {
  id: string;
  code: string;
  nameEn: string;
  imageUrl: string | null;
  active: boolean;
  catalogueCount: number;
  product: { id: string; name: string } | null;
};
type ProductOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

export function ProviderGamesBrowser({
  locale,
  dict,
  gameApiDict,
  providerId,
  providerKey,
  games,
  products,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["apiProviders"];
  gameApiDict: Dictionary["admin"]["gameapi"];
  providerId: string;
  providerKey: string;
  games: Game[];
  products: ProductOption[];
  categories: CategoryOption[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <SyncGamesButton locale={locale} dict={dict} providerId={providerId} providerKey={providerKey} />
      {games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {gameApiDict.noGames}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3 text-start">{gameApiDict.game}</th>
                <th className="p-3 text-start">{gameApiDict.linkedProduct}</th>
                <th className="p-3 text-start">{gameApiDict.catalogueCount}</th>
                <th className="p-3 text-start">{gameApiDict.active}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <GameRow
                  key={g.id}
                  locale={locale}
                  dict={gameApiDict}
                  providerKey={providerKey}
                  game={g}
                  products={products}
                  categories={categories}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SyncGamesButton({
  locale,
  dict,
  providerId,
  providerKey,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["apiProviders"];
  providerId: string;
  providerKey: string;
}) {
  const [state, action, pending] = useActionState<GenericSyncState, FormData>(
    syncProviderGamesAction,
    { ok: false },
  );
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="key" value={providerKey} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? dict.syncingItems : dict.syncItems}
      </button>
      {state.ok && state.code === "synced" && (
        <span className="text-sm font-bold text-emerald-500">
          {dict.syncedItems.replace("{count}", String(state.count ?? 0))}
        </span>
      )}
      {!state.ok && state.code && (
        <span className="text-sm font-bold text-red-500">{state.code}</span>
      )}
    </form>
  );
}

function GameRow({
  locale,
  dict,
  providerKey,
  game,
  products,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  providerKey: string;
  game: Game;
  products: ProductOption[];
  categories: CategoryOption[];
}) {
  const [active, setActive] = useState(game.active);
  const [, startTransition] = useTransition();
  const [createState, createAction, createPending] = useActionState<GenericSyncState, FormData>(
    createProductFromProviderGame,
    { ok: false },
  );

  function onToggleActive(next: boolean) {
    setActive(next);
    const fd = new FormData();
    fd.set("gameId", game.id);
    fd.set("active", next ? "on" : "off");
    fd.set("locale", locale);
    startTransition(() => {
      toggleGameActive(fd);
    });
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3">
        <div className="flex items-center gap-2.5">
          {game.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.imageUrl} alt="" className="size-8 rounded-lg object-contain" />
          )}
          <div>
            <p className="font-bold">{game.nameEn}</p>
            <p className="text-xs text-muted">{game.code}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <form action={linkGameToProduct} className="flex items-center gap-2">
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="locale" value={locale} />
          <select name="productId" defaultValue={game.product?.id ?? ""} className={FIELD}>
            <option value="">{dict.noneOption}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold hover:bg-surface-2">
            {dict.save}
          </button>
        </form>
        {!game.product && (
          <form action={createAction} className="mt-1.5 flex flex-wrap items-center gap-2">
            <input type="hidden" name="gameId" value={game.id} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="key" value={providerKey} />
            <span className="text-[11px] text-muted">{dict.orCreate}</span>
            <select name="categoryId" defaultValue={categories[0]?.id ?? ""} className={FIELD}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={categories.length === 0 || createPending}
              className="rounded-lg brand-gradient px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {dict.createProduct}
            </button>
            {!createState.ok && createState.code && (
              <span className="text-[11px] font-bold text-red-500">{createState.code}</span>
            )}
          </form>
        )}
      </td>
      <td className="p-3">
        <span className="font-bold">{game.catalogueCount}</span>
        <form action={syncProviderCatalogueAction} className="mt-1">
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="key" value={providerKey} />
          <button type="submit" className="text-xs font-semibold text-primary hover:underline">
            {dict.syncCatalogue}
          </button>
        </form>
      </td>
      <td className="p-3">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => onToggleActive(e.target.checked)}
          className="size-4 accent-[var(--color-primary)]"
        />
      </td>
      <td className="p-3 text-end">
        {game.product && (
          <Link
            href={`/${locale}/admin/api-providers/${providerKey}/games/${game.id}`}
            className="text-xs font-bold text-primary hover:underline"
          >
            {dict.manage}
          </Link>
        )}
      </td>
    </tr>
  );
}
