"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  toggleGameApiEnabled,
  toggleGameActive,
  linkGameToProduct,
  syncGamesAction,
  syncCatalogueAction,
  createProductFromGame,
  createAllProductsAction,
  removeAllApiProductsAction,
  addCuratedProductsAction,
  type GameApiState,
} from "@/lib/actions/gameapi";
import { ConfirmButton } from "@/components/ui/confirm-button";

const FIELD =
  "h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-xs outline-none focus:border-primary/50";

type Game = {
  id: string;
  code: string;
  nameEn: string;
  imageUrl: string | null;
  active: boolean;
  catalogueCount: number;
  lastSyncedAt: string | null;
  product: { id: string; name: string } | null;
};
type ProductOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };
type Connection =
  | { ok: true; username: string; balance: number }
  | { ok: false; message: string };

export function GameApiOverview({
  locale,
  dict,
  confirm,
  enabled,
  configured,
  connection,
  games,
  products,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  confirm: Dictionary["admin"]["confirm"];
  enabled: boolean;
  configured: boolean;
  connection: Connection;
  games: Game[];
  products: ProductOption[];
  categories: CategoryOption[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <ConnectionCard dict={dict} configured={configured} connection={connection} />
      <EnabledToggle locale={locale} dict={dict} enabled={enabled} />
      <div className="flex flex-wrap items-center gap-4">
        <SyncGamesButton locale={locale} dict={dict} />
        <CreateAllButton locale={locale} dict={dict} categories={categories} />
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-border bg-surface p-4">
        <AddCuratedButton locale={locale} dict={dict} categories={categories} />
        <RemoveAllButton locale={locale} dict={dict} confirm={confirm} />
      </div>
      <GamesTable locale={locale} dict={dict} games={games} products={products} categories={categories} />
    </div>
  );
}

function ConnectionCard({
  dict,
  configured,
  connection,
}: {
  dict: Dictionary["admin"]["gameapi"];
  configured: boolean;
  connection: Connection;
}) {
  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-600">
        {dict.notConfigured}
      </div>
    );
  }
  if (!connection.ok) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-500">
        {dict.connectionFailed}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <span className="text-sm font-bold text-emerald-600">
        {dict.connected} — {connection.username}
      </span>
      <span className="text-sm font-black text-emerald-600">
        {dict.balance}: ${connection.balance.toFixed(2)}
      </span>
    </div>
  );
}

function EnabledToggle({
  locale,
  dict,
  enabled,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  enabled: boolean;
}) {
  const [checked, setChecked] = useState(enabled);
  const [, startTransition] = useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    const fd = new FormData();
    fd.set("enabled", next ? "on" : "off");
    fd.set("locale", locale);
    startTransition(() => {
      toggleGameApiEnabled(fd);
    });
  }

  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-sm font-bold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--color-primary)]"
      />
      {dict.enabled}
      <span className="font-normal text-muted">{dict.enabledHint}</span>
    </label>
  );
}

function SyncGamesButton({ locale, dict }: { locale: Locale; dict: Dictionary["admin"]["gameapi"] }) {
  const [state, action, pending] = useActionState<GameApiState, FormData>(syncGamesAction, {
    ok: false,
  });
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? dict.syncing : dict.syncGames}
      </button>
      {state.ok && state.code === "synced" && (
        <span className="text-sm font-bold text-emerald-500">
          {dict.syncedCount.replace("{count}", String(state.count ?? 0))}
        </span>
      )}
      {!state.ok && state.code && (
        <span className="text-sm font-bold text-red-500">{dict.syncFailed}</span>
      )}
    </form>
  );
}

function CreateAllButton({
  locale,
  dict,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  categories: CategoryOption[];
}) {
  const [state, action, pending] = useActionState<GameApiState, FormData>(
    createAllProductsAction,
    { ok: false },
  );
  if (categories.length === 0) return null;
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="locale" value={locale} />
      <span className="text-xs font-semibold text-muted">{dict.createAllInto}</span>
      <select name="categoryId" defaultValue={categories[0].id} className={FIELD}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-surface-2 disabled:opacity-60"
      >
        {pending ? dict.creatingAll : dict.createAll}
      </button>
      {state.ok && state.code === "synced" && (
        <span className="text-sm font-bold text-emerald-500">
          {dict.createdCount.replace("{count}", String(state.count ?? 0))}
        </span>
      )}
      {!state.ok && state.code && (
        <span className="text-sm font-bold text-red-500">{dict.syncFailed}</span>
      )}
    </form>
  );
}

function AddCuratedButton({
  locale,
  dict,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  categories: CategoryOption[];
}) {
  const [state, action, pending] = useActionState<GameApiState, FormData>(
    addCuratedProductsAction,
    { ok: false },
  );
  if (categories.length === 0) return null;
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="locale" value={locale} />
      <span className="text-xs font-semibold text-muted">{dict.addCuratedInto}</span>
      <select name="categoryId" defaultValue={categories[0].id} className={FIELD}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? dict.creatingAll : dict.addCurated}
      </button>
      {state.ok && state.code === "synced" && (
        <span className="text-sm font-bold text-emerald-500">
          {dict.createdCount.replace("{count}", String(state.count ?? 0))}
        </span>
      )}
      {!state.ok && state.code && (
        <span className="text-sm font-bold text-red-500">{dict.syncFailed}</span>
      )}
    </form>
  );
}

function RemoveAllButton({
  locale,
  dict,
  confirm,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  confirm: Dictionary["admin"]["confirm"];
}) {
  return (
    <ConfirmButton
      action={removeAllApiProductsAction}
      hidden={{ locale }}
      title={dict.removeAllTitle}
      body={dict.removeAllBody}
      confirmText={confirm.yes}
      cancelText={confirm.no}
      className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10"
    >
      {dict.removeAll}
    </ConfirmButton>
  );
}

function GamesTable({
  locale,
  dict,
  games,
  products,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  games: Game[];
  products: ProductOption[];
  categories: CategoryOption[];
}) {
  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
        {dict.noGames}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[52rem] text-sm">
        <thead className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted">
          <tr>
            <th className="p-3 text-start">{dict.game}</th>
            <th className="p-3 text-start">{dict.linkedProduct}</th>
            <th className="p-3 text-start">{dict.catalogueCount}</th>
            <th className="p-3 text-start">{dict.active}</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <GameRow key={g.id} locale={locale} dict={dict} game={g} products={products} categories={categories} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GameRow({
  locale,
  dict,
  game,
  products,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["gameapi"];
  game: Game;
  products: ProductOption[];
  categories: CategoryOption[];
}) {
  const [active, setActive] = useState(game.active);
  const [, startTransition] = useTransition();
  const [createState, createAction, createPending] = useActionState<GameApiState, FormData>(
    createProductFromGame,
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
        <form action={syncCatalogueAction} className="mt-1">
          <input type="hidden" name="gameCode" value={game.code} />
          <input type="hidden" name="locale" value={locale} />
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
            href={`/${locale}/admin/gameapi/${game.code}`}
            className="text-xs font-bold text-primary hover:underline"
          >
            {dict.manage}
          </Link>
        )}
      </td>
    </tr>
  );
}
