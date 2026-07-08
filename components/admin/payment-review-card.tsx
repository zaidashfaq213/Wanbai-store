"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Currency } from "@/lib/data/catalog";
import { approveSubmission, rejectSubmission } from "@/lib/actions/payments";
import { formatCents, cn } from "@/lib/utils";

export type ReviewSubmission = {
  id: string;
  purpose: "WALLET_TOPUP" | "ORDER";
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  senderName: string | null;
  reference: string | null;
  createdAt: string;
  proofUrl: string;
  bankName: string;
  userName: string;
  userEmail: string;
  orderRef: string | null;
  adminNote: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  APPROVED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
};

export function PaymentReviewCard({
  submission: s,
  locale,
  dict,
  statusLabels,
  currency,
}: {
  submission: ReviewSubmission;
  locale: Locale;
  dict: Dictionary["admin"]["payments"];
  statusLabels: Record<string, string>;
  currency: Currency;
}) {
  const [zoom, setZoom] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:gap-4">
      {/* Screenshot */}
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="shrink-0 self-start overflow-hidden rounded-xl border border-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.proofUrl} alt={dict.viewProof} className="h-28 w-28 object-cover" />
      </button>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-lg font-black text-primary">
            {formatCents(s.amount, currency.symbol, currency.rate, locale)}
          </span>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", STATUS_STYLE[s.status])}>
            {statusLabels[s.status]}
          </span>
        </div>

        <div className="mt-1 grid gap-x-4 gap-y-0.5 text-xs text-muted sm:grid-cols-2">
          <p>
            {dict.user}: <span className="font-semibold text-foreground">{s.userName}</span> · {s.userEmail}
          </p>
          <p>
            {dict.bank}: <span className="font-semibold text-foreground">{s.bankName}</span>
          </p>
          <p>
            {s.purpose === "ORDER" ? `${dict.order}: ${s.orderRef ?? "—"}` : dict.topup}
          </p>
          <p>
            {dict.submittedAt}:{" "}
            {new Date(s.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
          </p>
          {s.senderName && (
            <p>
              {dict.sender}: <span className="text-foreground">{s.senderName}</span>
            </p>
          )}
          {s.reference && (
            <p>
              {dict.reference}: <span className="text-foreground">{s.reference}</span>
            </p>
          )}
        </div>

        {s.adminNote && (
          <p className="mt-2 rounded-lg bg-red-500/5 px-2.5 py-1.5 text-xs text-red-500">
            {s.adminNote}
          </p>
        )}

        {/* Actions (pending only) */}
        {s.status === "PENDING" && (
          <div className="mt-3">
            {!rejecting ? (
              <div className="flex flex-wrap gap-2">
                <form action={approveSubmission}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
                  >
                    {dict.approve}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/10"
                >
                  {dict.reject}
                </button>
              </div>
            ) : (
              <form action={rejectSubmission} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="locale" value={locale} />
                <textarea
                  name="note"
                  rows={2}
                  placeholder={dict.rejectReason}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
                  >
                    {dict.confirmReject}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejecting(false)}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-surface-2"
                  >
                    ✕
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Zoom modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.proofUrl} alt={dict.viewProof} className="max-h-[90vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
