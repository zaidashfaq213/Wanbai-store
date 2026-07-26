"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Currency } from "@/lib/data/catalog";
import type {
  Fulfillment,
  InputField,
  Package,
  VariantGroup,
} from "@/lib/data/product-detail";
import { cn, formatPrice, formatCents } from "@/lib/utils";
import { createOrder } from "@/lib/actions/checkout";
import { toggleFavorite } from "@/lib/actions/account";
import { BoltIcon, HeartIcon, ShareIcon, UserIcon, WalletIcon } from "@/components/ui/icons";

function defaultPackage(group: VariantGroup): Package {
  return group.packages.find((p) => p.popular) ?? group.packages[0];
}

const DELIVERY_MAP: Record<Fulfillment, "TOPUP" | "CODE" | "SERVICE"> = {
  topup: "TOPUP",
  code: "CODE",
  service: "SERVICE",
};

type SuccessResult = { orderRef: string };

// Buying is wallet-only — bank transfer per order was removed, so every
// purchase settles instantly against a balance the customer already topped up
// (that's still done by bank transfer, just on the Wallet page, not here).
export function PurchasePanel({
  product,
  variantGroups,
  inputs,
  fulfillment,
  currency,
  locale,
  dict,
  isAuthed,
  walletBalanceCents,
}: {
  product: { slug: string; name: string; categorySlug: string };
  variantGroups: VariantGroup[];
  inputs: InputField[];
  fulfillment: Fulfillment;
  currency: Currency;
  locale: Locale;
  dict: Dictionary;
  isAuthed: boolean;
  walletBalanceCents: number;
}) {
  const router = useRouter();
  const [groupIdx, setGroupIdx] = useState(0);
  const [pkgId, setPkgId] = useState(() => defaultPackage(variantGroups[0]).id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const [pending, startTransition] = useTransition();

  const group = variantGroups[groupIdx];
  const pkg = group.packages.find((p) => p.id === pkgId) ?? group.packages[0];
  const p = dict.product;
  const c = dict.checkout;

  const totalCents = pkg ? Math.round(pkg.price * 100) : 0;
  const canAfford = isAuthed && walletBalanceCents >= totalCents;

  function selectGroup(i: number) {
    setGroupIdx(i);
    setPkgId(defaultPackage(variantGroups[i]).id);
  }

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3600);
  }

  function errorFor(code?: string) {
    const map: Record<string, string> = {
      insufficient_funds: c.errors.insufficientFunds,
      requires_auth: c.errors.requiresAuth,
      invalid_input: c.errors.invalidInput,
    };
    return (code && map[code]) || c.errors.generic;
  }

  function goLogin() {
    router.push(`/${locale}/login?callbackUrl=/${locale}/product/${product.slug}`);
  }

  function buyNow() {
    if (!isAuthed) return goLogin();
    if (!pkg) return flash(p.needPackage);
    const missing = inputs.some((f) => f.required && !values[f.id]?.trim());
    if (missing) return flash(p.needFields);
    if (!canAfford) return flash(c.errors.insufficientFunds);

    startTransition(async () => {
      const res = await createOrder({
        locale,
        currency: currency.code,
        item: {
          productSlug: product.slug,
          productName: product.name,
          categorySlug: product.categorySlug,
          variantLabel: variantGroups.length > 1 ? group.name[locale] : undefined,
          packageLabel: pkg.label[locale],
          unitPriceUsd: pkg.price,
          deliveryType: DELIVERY_MAP[fulfillment],
          inputs: Object.keys(values).length ? values : undefined,
        },
      });

      if (!res.ok) return flash(errorFor(res.code));
      setSuccess({ orderRef: res.orderRef ?? "" });
      router.refresh(); // refresh wallet balance / notifications in the shell
    });
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-2xl">
            ✅
          </div>
          <p className="mt-2 text-lg font-black">{c.success.paidTitle}</p>
          <p className="mt-1 text-sm text-muted">
            {c.success.orderRef}: <span className="font-bold">{success.orderRef}</span>
          </p>
        </div>

        <p className="text-center text-sm text-muted">{c.success.paidBody}</p>
        <a
          href={`/${locale}/dashboard/orders`}
          className="rounded-xl brand-gradient py-3 text-center text-sm font-bold text-white"
        >
          {c.success.viewOrders}
        </a>

        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="text-sm font-semibold text-muted hover:text-primary"
        >
          {c.success.buyMore}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Variant groups (tabs) */}
      {variantGroups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {variantGroups.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => selectGroup(i)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-bold transition-colors",
                i === groupIdx
                  ? "border-transparent brand-gradient text-white"
                  : "border-border bg-surface hover:bg-surface-2",
              )}
            >
              {g.name[locale]}
            </button>
          ))}
        </div>
      )}

      {/* Package grid */}
      <div>
        <p className="mb-2 text-sm font-bold">{group.name[locale]}</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {group.packages.map((option) => {
            const active = option.id === pkg?.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPkgId(option.id)}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition-all",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border bg-surface hover:border-primary/40",
                )}
              >
                {option.popular && (
                  <span className="absolute -top-2 rounded-full brand-gradient px-2 py-0.5 text-[10px] font-bold text-white ltr:right-2 rtl:left-2">
                    {p.popular}
                  </span>
                )}
                <span className="text-sm font-bold leading-tight">{option.label[locale]}</span>
                {option.sublabel && (
                  <span className="text-[11px] text-muted">{option.sublabel[locale]}</span>
                )}
                <span className="text-sm font-extrabold text-primary">
                  {formatPrice(option.price, currency.symbol, currency.rate, locale)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs */}
      {inputs.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold">{p.enterDetails}</p>
          <div className="flex flex-col gap-3">
            {inputs.map((field) => (
              <label key={field.id} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  {field.label[locale]}
                  {field.required && <span className="text-primary"> *</span>}
                </span>
                <input
                  type={field.kind === "number" ? "number" : "text"}
                  inputMode={field.kind === "number" ? "numeric" : undefined}
                  placeholder={field.placeholder[locale]}
                  value={values[field.id] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.id]: e.target.value }))
                  }
                  className="h-11 rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Code-delivery note */}
      {fulfillment === "code" && (
        <p className="rounded-xl bg-primary/5 p-3 text-xs font-medium text-primary">
          {p.codeDelivery}
        </p>
      )}

      {/* Wallet balance (logged-in only — buying is wallet-only) */}
      {isAuthed && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <WalletIcon className="size-4 text-primary" />
            {c.payWallet}
          </span>
          <span className={cn("text-sm font-extrabold", canAfford ? "text-primary" : "text-red-500")}>
            {formatCents(walletBalanceCents, currency.symbol, currency.rate, locale)}
          </span>
        </div>
      )}

      {/* Total + buy / top-up / sign-in */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted">{p.total}</span>
          <span className="text-2xl font-black text-primary">
            {pkg ? formatPrice(pkg.price, currency.symbol, currency.rate, locale) : "—"}
          </span>
        </div>
        {isAuthed ? (
          canAfford ? (
            <>
              <button
                type="button"
                onClick={buyNow}
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient py-3.5 text-base font-bold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
              >
                <BoltIcon className="size-5" />
                {pending ? c.placingOrder : p.buyNow}
              </button>
              <p className="mt-2 text-center text-xs text-muted">{p.buyNote}</p>
            </>
          ) : (
            <>
              <p className="mb-3 text-center text-sm font-semibold text-red-500">
                {c.insufficientTitle}
              </p>
              <a
                href={`/${locale}/dashboard/wallet`}
                className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient py-3.5 text-base font-bold text-white shadow-sm transition-transform hover:scale-[1.01]"
              >
                <WalletIcon className="size-5" />
                {c.topUpWallet}
              </a>
              <p className="mt-2 text-center text-xs text-muted">{c.insufficientBody}</p>
            </>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={goLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient py-3.5 text-base font-bold text-white shadow-sm transition-transform hover:scale-[1.01]"
            >
              <UserIcon className="size-5" />
              {c.signInToBuy}
            </button>
            <p className="mt-2 text-center text-xs text-muted">{c.signInHint}</p>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90vw] rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-[var(--shadow-pop)] md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}

export function ShareSaveButtons({
  dict,
  locale,
  name,
  productSlug,
  isAuthed,
  initialSaved,
}: {
  dict: Dictionary;
  locale: Locale;
  name: string;
  productSlug: string;
  isAuthed: boolean;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: name, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(window.location.href).catch(() => {});
    }
  }

  function save() {
    if (!isAuthed) {
      router.push(`/${locale}/login`);
      return;
    }
    setSaved((v) => !v); // optimistic
    startTransition(async () => {
      const res = await toggleFavorite(productSlug);
      if (!res.ok) setSaved((v) => !v); // revert on failure
      else if (typeof res.favorited === "boolean") setSaved(res.favorited);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={save}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? dict.product.saved : dict.product.save}
        className={cn(
          "grid size-10 place-items-center rounded-xl border transition-colors disabled:opacity-60",
          saved
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-surface text-muted hover:text-primary",
        )}
      >
        <HeartIcon className={cn("size-5", saved && "fill-primary")} />
      </button>
      <button
        type="button"
        onClick={share}
        aria-label={dict.product.share}
        className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-primary"
      >
        <ShareIcon className="size-5" />
      </button>
    </div>
  );
}
