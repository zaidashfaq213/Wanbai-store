"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { submitGsmOrder, type GsmCheckoutState } from "@/lib/actions/gsm-checkout";
import { cn, formatUsd } from "@/lib/utils";
import { BoltIcon, UserIcon, WalletIcon } from "@/components/ui/icons";

export type GsmField = {
  id: string;
  key: string;
  label: string;
  placeholder: string;
  kind: string; // "text" | "number" | "file"
  required: boolean;
};

export type GsmVariant = { id: string; name: string; priceCents: number };

const FIELD =
  "h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface";

export function GsmOrderForm({
  locale,
  dict,
  serviceId,
  priceCents,
  variants,
  fields,
  isAuthed,
  walletBalanceCents,
}: {
  locale: Locale;
  dict: Dictionary;
  serviceId: string;
  /** The service's own flat price — only actually charged when `variants` is
   * empty. Ignored once the service has products to choose from. */
  priceCents: number;
  /** Optional priced products under this service (see GsmServiceVariant) —
   * when present, the customer must pick one and its price is charged
   * instead of `priceCents`. */
  variants?: GsmVariant[];
  fields: GsmField[];
  isAuthed: boolean;
  /** GSM wallet balance (USD cents) — the separate balance used only for GSM
   * Services, never the main store (SDG) wallet. */
  walletBalanceCents: number;
}) {
  const router = useRouter();
  const g = dict.gsm;
  const [state, action, pending] = useActionState<GsmCheckoutState, FormData>(submitGsmOrder, { ok: false, code: "" });
  const hasVariants = Boolean(variants && variants.length > 0);
  const [selectedVariantId, setSelectedVariantId] = useState(hasVariants ? variants![0].id : "");
  const selectedVariant = hasVariants ? variants!.find((v) => v.id === selectedVariantId) : undefined;
  const effectivePrice = hasVariants ? (selectedVariant?.priceCents ?? 0) : priceCents;
  const canAfford = isAuthed && walletBalanceCents >= effectivePrice;

  function errorFor(code: string) {
    const map = g.errors as Record<string, string>;
    return map[code] ?? map.server_error;
  }

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-2xl">✅</div>
        <p className="text-lg font-black">{g.orderPlacedTitle}</p>
        <p className="text-sm text-muted">{g.orderPlacedBody}</p>
        <p className="text-sm">
          <span className="text-muted">{dict.admin.gsm.orders.ref}:</span>{" "}
          <span className="font-bold">{state.ref}</span>
        </p>
        <a
          href={`/${locale}/dashboard/gsm-orders/${state.ref}`}
          className="rounded-xl brand-gradient py-3 text-center text-sm font-bold text-white"
        >
          {g.viewOrder}
        </a>
        <a href={`/${locale}/gsm`} className="text-sm font-semibold text-muted hover:text-primary">
          {g.orderAnother}
        </a>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center shadow-[var(--shadow-card)]">
        <p className="mb-3 text-sm font-semibold">{g.loginRequired}</p>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/login?callbackUrl=/${locale}/gsm`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient py-3.5 text-base font-bold text-white shadow-sm transition-transform hover:scale-[1.01]"
        >
          <UserIcon className="size-5" />
          {g.login}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="locale" value={locale} />
      {hasVariants && <input type="hidden" name="variantId" value={selectedVariantId} />}

      <div>
        <h3 className="font-extrabold">{g.checkoutTitle}</h3>
        <p className="mt-0.5 text-xs text-muted">{g.checkoutSubtitle}</p>
      </div>

      {hasVariants && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-muted">{g.chooseProduct}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {variants!.map((v) => {
              const active = v.id === selectedVariantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border p-3 text-start transition-all",
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-bold">{v.name}</span>
                  <span className="shrink-0 text-sm font-black text-primary">
                    {formatUsd(v.priceCents, locale)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <label key={f.id} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">
                {f.label}
                {f.required && <span className="text-primary"> *</span>}
              </span>
              {f.kind === "file" ? (
                <input
                  type="file"
                  name={f.key}
                  required={f.required}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-primary"
                />
              ) : (
                <input
                  type={f.kind === "number" ? "number" : "text"}
                  inputMode={f.kind === "number" ? "numeric" : undefined}
                  name={f.key}
                  required={f.required}
                  placeholder={f.placeholder}
                  className={FIELD}
                />
              )}
            </label>
          ))}
        </div>
      )}

      {hasVariants && (
        <div className="flex items-center justify-between px-0.5 text-sm">
          <span className="font-semibold text-muted">{g.priceLabel}</span>
          <span className="font-black text-primary">{formatUsd(effectivePrice, locale)}</span>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-3">
        <span className="flex items-center gap-2 text-sm font-bold">
          <WalletIcon className="size-4 text-primary" />
          {g.walletBalance}
        </span>
        <span className={cn("text-sm font-extrabold", canAfford ? "text-primary" : "text-red-500")}>
          {formatUsd(walletBalanceCents, locale)}
        </span>
      </div>

      {!state.ok && state.code && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
          {errorFor(state.code)}
        </p>
      )}

      {canAfford ? (
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient py-3.5 text-base font-bold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
        >
          <BoltIcon className="size-5" />
          {pending ? g.submitting : g.submit}
        </button>
      ) : (
        <>
          <p className="text-center text-sm font-semibold text-red-500">{g.insufficientFunds}</p>
          <a
            href={`/${locale}/dashboard/gsm-wallet`}
            className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient py-3.5 text-base font-bold text-white shadow-sm transition-transform hover:scale-[1.01]"
          >
            <WalletIcon className="size-5" />
            {g.addFunds}
          </a>
        </>
      )}
    </form>
  );
}
