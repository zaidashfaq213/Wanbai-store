"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  setGsmOrderStatus,
  addGsmOrderNote,
  uploadGsmResultFile,
  deleteGsmOrderFile,
  GSM_ALLOWED_NEXT,
  type GsmState,
} from "@/lib/actions/gsm-admin";
import { cn } from "@/lib/utils";
import type { GsmOrderStatus } from "@prisma/client";

type Dict = Dictionary["admin"]["gsm"]["orders"];
type Errors = Dictionary["admin"]["gsm"]["errors"];

const STATUS_STYLES: Record<GsmOrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  UNDER_REVIEW: "bg-violet-500/10 text-violet-500",
  IN_PROGRESS: "bg-primary/10 text-primary",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
  CANCELLED: "bg-muted/10 text-muted",
};

export type GsmOrderDetailData = {
  id: string;
  ref: string;
  status: GsmOrderStatus;
  serviceName: string;
  categoryName: string;
  price: string;
  createdAt: string;
  customer: string;
  customerEmail: string;
  fieldAnswers: Array<{ label: string; value: string }>;
  customerFiles: Array<{ id: string; filename: string; data: string }>;
  resultFiles: Array<{ id: string; filename: string; data: string }>;
  notes: Array<{ id: string; body: string; isStaff: boolean; authorName: string | null; createdAt: string }>;
};

function FileList({
  files,
  locale,
  orderId,
  deletable,
  emptyLabel,
}: {
  files: GsmOrderDetailData["customerFiles"];
  locale: Locale;
  orderId: string;
  deletable?: boolean;
  emptyLabel: string;
}) {
  if (files.length === 0) return <p className="text-sm text-muted">{emptyLabel}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((f) => (
        <div key={f.id} className="relative">
          <a
            href={f.data}
            target="_blank"
            rel="noreferrer"
            download={f.filename}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold hover:bg-surface"
          >
            📎 {f.filename}
          </a>
          {deletable && (
            <form action={deleteGsmOrderFile} className="mt-1">
              <input type="hidden" name="id" value={f.id} />
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="text-[11px] font-semibold text-red-500 hover:underline">
                ✕
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}

export function GsmOrderDetail({
  locale,
  dict,
  errors,
  order,
}: {
  locale: Locale;
  dict: Dict;
  errors: Errors;
  order: GsmOrderDetailData;
}) {
  const [statusState, statusAction, statusPending] = useActionState<GsmState, FormData>(setGsmOrderStatus, { ok: false });
  const [noteState, noteAction, notePending] = useActionState<GsmState, FormData>(addGsmOrderNote, { ok: false });
  const [uploadState, uploadAction, uploadPending] = useActionState<GsmState, FormData>(uploadGsmResultFile, { ok: false });

  const nextOptions = GSM_ALLOWED_NEXT[order.status] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-black">{order.ref}</p>
            <p className="text-sm text-muted">
              {order.customer} · {order.customerEmail}
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1.5 text-sm font-bold", STATUS_STYLES[order.status])}>
            {dict.statusLabels[order.status]}
          </span>
        </div>
        <div className="mt-3 grid gap-2 border-t border-border pt-3 text-sm sm:grid-cols-3">
          <p><span className="text-muted">{dict.service}:</span> <span className="font-semibold">{order.serviceName}</span></p>
          <p><span className="text-muted">{dict.price}:</span> <span className="font-semibold">{order.price}</span></p>
          <p><span className="text-muted">{dict.date}:</span> <span className="font-semibold">{order.createdAt}</span></p>
        </div>
      </div>

      {order.fieldAnswers.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-extrabold">{dict.submittedFields}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {order.fieldAnswers.map((f, i) => (
              <p key={i} className="text-sm">
                <span className="text-muted">{f.label}:</span> <span className="font-semibold">{f.value}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-extrabold">{dict.customerFiles}</h3>
        <FileList files={order.customerFiles} locale={locale} orderId={order.id} emptyLabel={dict.noFiles} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-extrabold">{dict.resultFiles}</h3>
        <FileList files={order.resultFiles} locale={locale} orderId={order.id} deletable emptyLabel={dict.noFiles} />
        <form action={uploadAction} className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="locale" value={locale} />
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            required
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-primary"
          />
          <button type="submit" disabled={uploadPending} className="h-9 rounded-lg brand-gradient px-3 text-xs font-bold text-white disabled:opacity-60">
            {dict.upload}
          </button>
          {!uploadState.ok && uploadState.code && (
            <span className="text-xs font-bold text-red-500">
              {(errors as Record<string, string>)[uploadState.code] ?? errors.invalid_input}
            </span>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-extrabold">{dict.updateStatus}</h3>
        {nextOptions.length === 0 ? (
          <p className="text-sm text-muted">{dict.noTransitions}</p>
        ) : (
          <form action={statusAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="locale" value={locale} />
            <select
              name="status"
              className="h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50"
            >
              {nextOptions.map((st) => (
                <option key={st} value={st}>{dict.statusLabels[st]}</option>
              ))}
            </select>
            <button type="submit" disabled={statusPending} className="h-10 rounded-xl brand-gradient px-4 text-sm font-bold text-white disabled:opacity-60">
              {dict.updateStatus}
            </button>
            {!statusState.ok && statusState.code && (
              <span className="text-xs font-bold text-red-500">
                {(errors as Record<string, string>)[statusState.code] ?? errors.invalid_input}
              </span>
            )}
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-extrabold">{dict.notes}</h3>
        <div className="flex flex-col gap-2">
          {order.notes.length === 0 && <p className="text-sm text-muted">{dict.noNotes}</p>}
          {order.notes.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-xl p-3 text-sm",
                n.isStaff ? "bg-primary/5" : "bg-surface-2",
              )}
            >
              <p>{n.body}</p>
              <p className="mt-1 text-[11px] text-muted">
                {n.isStaff ? n.authorName ?? "Staff" : order.customer} · {n.createdAt}
              </p>
            </div>
          ))}
        </div>
        <form action={noteAction} className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="locale" value={locale} />
          <textarea
            name="body"
            rows={2}
            placeholder={dict.noteBody}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <button type="submit" disabled={notePending} className="self-start rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {dict.send}
          </button>
          {!noteState.ok && noteState.code && (
            <span className="text-xs font-bold text-red-500">
              {(errors as Record<string, string>)[noteState.code] ?? errors.invalid_input}
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
