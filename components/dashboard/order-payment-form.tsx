"use client";

import { useActionState, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { BankOption } from "@/components/dashboard/bank-topup";
import { submitOrderPayment, type PaymentState } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";

export function OrderPaymentForm({
  locale,
  dict,
  banks,
  orderRef,
}: {
  locale: Locale;
  dict: Dictionary["payments"];
  banks: BankOption[];
  orderRef: string;
}) {
  const [open, setOpen] = useState(false);
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<PaymentState, FormData>(
    submitOrderPayment,
    { ok: false },
  );

  const bank = banks.find((b) => b.id === bankId);

  if (state.ok && state.code === "submitted") {
    return (
      <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-500">
        {dict.pendingTitle} — {dict.pendingBody}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white"
      >
        {dict.submit}
      </button>
    );
  }

  const errorMsg =
    !state.ok && state.code
      ? (dict.errors as Record<string, string>)[state.code] ?? dict.errors.generic
      : null;

  return (
    <form action={action} className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="orderRef" value={orderRef} />
      <input type="hidden" name="bankAccountId" value={bankId} />

      <div className="grid gap-2 sm:grid-cols-3">
        {banks.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBankId(b.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-2 text-start text-xs font-bold transition-colors",
              b.id === bankId ? "border-primary bg-primary/5" : "border-border hover:bg-surface",
            )}
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg text-[10px] font-black text-white"
              style={{ backgroundColor: b.color ?? "#6d28d9" }}
            >
              {b.nameEn.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}
            </span>
            <span className="truncate">{locale === "ar" ? b.nameAr : b.nameEn}</span>
          </button>
        ))}
      </div>

      {bank && (
        <p className="text-xs text-muted">
          {dict.transferTo}: <span className="font-bold text-foreground">{bank.accountName}</span> ·{" "}
          <span className="font-mono font-bold text-foreground" dir="ltr">{bank.accountNumber}</span>
        </p>
      )}

      <input
        ref={fileRef}
        name="screenshot"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        required
        onChange={(e) => setPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface p-2 text-sm font-bold text-primary"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-24 rounded-lg object-contain" />
        ) : (
          <span>🧾 {dict.uploadProof}</span>
        )}
      </button>

      {errorMsg && <p className="text-sm font-medium text-red-500">{errorMsg}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? dict.submitting : dict.submit}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-surface"
        >
          ✕
        </button>
      </div>
    </form>
  );
}
