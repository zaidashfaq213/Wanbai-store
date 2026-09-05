"use client";

import { useActionState, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { submitGsmWalletTopUp } from "@/lib/actions/payments";
import type { PaymentState } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";
import type { BankOption } from "@/components/dashboard/bank-topup";

const FIELD =
  "h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface";

// Same shape as components/dashboard/bank-topup.tsx's BankTile, duplicated
// (not imported) since that one's file only exports the component tied to
// the SDG wallet's action — kept here so this file has no coupling to it.
function BankTile({
  bank,
  locale,
  active,
  onSelect,
}: {
  bank: BankOption;
  locale: Locale;
  active: boolean;
  onSelect: () => void;
}) {
  const name = locale === "ar" ? bank.nameAr : bank.nameEn;
  const initials = bank.nameEn.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 text-start transition-all",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border bg-surface hover:border-primary/40",
      )}
    >
      {bank.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bank.logo}
          alt={name}
          className="size-11 shrink-0 rounded-xl bg-white object-contain p-1 shadow-sm"
        />
      ) : (
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-sm"
          style={{ backgroundColor: bank.color ?? "#6d28d9" }}
        >
          {initials}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{name}</span>
        <span className="block truncate text-xs text-muted" dir="ltr">
          {bank.accountNumber}
        </span>
      </span>
    </button>
  );
}

// Top-up form for the separate GSM (USD) wallet — same UI/UX as BankTopUp,
// just calling submitGsmWalletTopUp and always labelling the amount in USD
// (never run through the storefront's selected display currency, since the
// GSM wallet is always real USD).
export function GsmBankTopUp({
  locale,
  dict,
  banks,
}: {
  locale: Locale;
  dict: Dictionary["payments"];
  banks: BankOption[];
}) {
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<PaymentState, FormData>(
    submitGsmWalletTopUp,
    { ok: false },
  );

  const bank = banks.find((b) => b.id === bankId);
  const instructions = bank
    ? locale === "ar"
      ? bank.instructionsAr
      : bank.instructionsEn
    : null;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function copyNumber() {
    if (!bank) return;
    navigator.clipboard?.writeText(bank.accountNumber.replace(/\s/g, "")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (state.ok && state.code === "submitted") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-emerald-500/15 text-2xl">
          ⏳
        </span>
        <div>
          <p className="text-base font-black">{dict.pendingTitle}</p>
          <p className="mt-1 text-sm text-muted">{dict.pendingBody}</p>
        </div>
      </div>
    );
  }

  const errorMsg =
    !state.ok && state.code
      ? (dict.errors as Record<string, string>)[state.code] ?? dict.errors.generic
      : null;

  if (banks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
        {dict.noGsmBanks}
      </div>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="bankAccountId" value={bankId} />

      {/* Amount — always literal USD, never converted */}
      <div>
        <p className="mb-2 text-sm font-bold">{dict.gsmAmount}</p>
        <input
          name="amountUsd"
          type="number"
          min={1}
          max={10000000}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className={FIELD}
        />
      </div>

      {/* Bank choice */}
      <div>
        <p className="mb-2 text-sm font-bold">{dict.chooseBank}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {banks.map((b) => (
            <BankTile
              key={b.id}
              bank={b}
              locale={locale}
              active={b.id === bankId}
              onSelect={() => setBankId(b.id)}
            />
          ))}
        </div>
      </div>

      {/* Selected bank details */}
      {bank && (
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {dict.transferTo}
          </p>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">{dict.accountName}</span>
              <span className="font-bold">{bank.accountName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">{dict.accountNumber}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono font-bold" dir="ltr">
                  {bank.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="rounded-lg border border-border bg-surface px-2 py-0.5 text-xs font-bold transition-colors hover:bg-surface-3"
                >
                  {copied ? dict.copied : dict.copy}
                </button>
              </span>
            </div>
          </div>
          {instructions && (
            <p className="mt-3 rounded-lg bg-primary/5 p-2.5 text-xs text-primary">
              {instructions}
            </p>
          )}
        </div>
      )}

      {/* Sender details (optional) */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.senderName}</span>
          <input name="senderName" type="text" placeholder={dict.senderNamePlaceholder} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.reference}</span>
          <input name="reference" type="text" placeholder={dict.referencePlaceholder} className={FIELD} />
        </label>
      </div>

      {/* Screenshot upload */}
      <div>
        <p className="mb-2 text-sm font-bold">{dict.uploadProof}</p>
        <input
          ref={fileRef}
          name="screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          onChange={onFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-2 p-4 text-center transition-colors hover:border-primary/40"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="max-h-48 rounded-xl object-contain" />
          ) : (
            <span className="grid size-11 place-items-center rounded-xl bg-surface text-xl">
              🧾
            </span>
          )}
          <span className="text-sm font-bold text-primary">
            {preview ? dict.changeImage : dict.uploadProof}
          </span>
          <span className="text-[11px] text-muted">{dict.uploadHint}</span>
        </button>
      </div>

      {errorMsg && (
        <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !bankId}
        className="rounded-xl brand-gradient py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
