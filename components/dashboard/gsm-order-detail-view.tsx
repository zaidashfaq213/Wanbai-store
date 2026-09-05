"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { addCustomerGsmOrderNote } from "@/lib/actions/gsm-checkout";
import type { GsmState } from "@/lib/actions/gsm-admin";
import type { GsmOrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

type Dict = Dictionary["dashboard"]["gsmOrders"];

const STATUS_STYLES: Record<GsmOrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  PAID: "bg-sky-500/10 text-sky-500",
  UNDER_REVIEW: "bg-violet-500/10 text-violet-500",
  IN_PROGRESS: "bg-primary/10 text-primary",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
  CANCELLED: "bg-muted/10 text-muted",
};

const TIMELINE: GsmOrderStatus[] = ["PAID", "UNDER_REVIEW", "IN_PROGRESS", "COMPLETED"];

export type GsmOrderView = {
  ref: string;
  status: GsmOrderStatus;
  serviceName: string;
  price: string;
  createdAt: string;
  fieldAnswers: Array<{ label: string; value: string }>;
  files: Array<{ id: string; filename: string; data: string; source: string }>;
  notes: Array<{ id: string; body: string; isStaff: boolean; createdAt: string }>;
};

export function GsmOrderDetailView({
  locale,
  dict,
  order,
}: {
  locale: Locale;
  dict: Dict;
  order: GsmOrderView;
}) {
  const [state, action, pending] = useActionState<GsmState, FormData>(addCustomerGsmOrderNote, { ok: false });
  const stopped = order.status === "REJECTED" || order.status === "CANCELLED";
  const currentIdx = TIMELINE.indexOf(order.status);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-black">{order.ref}</p>
            <p className="text-sm text-muted">{order.serviceName}</p>
          </div>
          <span className={cn("rounded-full px-3 py-1.5 text-sm font-bold", STATUS_STYLES[order.status])}>
            {dict.statusLabels[order.status]}
          </span>
        </div>
        <div className="mt-3 grid gap-2 border-t border-border pt-3 text-sm sm:grid-cols-2">
          <p><span className="text-muted">{dict.price}:</span> <span className="font-semibold">{order.price}</span></p>
          <p><span className="text-muted">{dict.date}:</span> <span className="font-semibold">{order.createdAt}</span></p>
        </div>

        {!stopped && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{dict.statusTimelineTitle}</p>
            <div className="flex items-center gap-1">
              {TIMELINE.map((st, i) => (
                <div key={st} className="flex flex-1 items-center gap-1">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                      i <= currentIdx ? "brand-gradient text-white" : "bg-surface-2 text-muted",
                    )}
                  >
                    {i < currentIdx ? "✓" : i + 1}
                  </span>
                  {i < TIMELINE.length - 1 && (
                    <span className={cn("h-0.5 flex-1", i < currentIdx ? "bg-primary" : "bg-border")} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-muted">
              {TIMELINE.map((st) => (
                <span key={st} className="w-14 text-center first:text-start last:text-end">
                  {dict.statusLabels[st]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {order.fieldAnswers.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-extrabold">{dict.submittedDetails}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {order.fieldAnswers.map((f, i) => (
              <p key={i} className="text-sm">
                <span className="text-muted">{f.label}:</span> <span className="font-semibold">{f.value}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {order.files.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-extrabold">
            {order.files.some((f) => f.source === "admin") ? dict.deliveredFiles : dict.files}
          </h3>
          <div className="flex flex-wrap gap-2">
            {order.files.map((f) => (
              <a
                key={f.id}
                href={f.data}
                target="_blank"
                rel="noreferrer"
                download={f.filename}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold hover:bg-surface"
              >
                📎 {f.filename}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-extrabold">{dict.notes}</h3>
        <div className="flex flex-col gap-2">
          {order.notes.length === 0 && <p className="text-sm text-muted">{dict.noNotes}</p>}
          {order.notes.map((n) => (
            <div
              key={n.id}
              className={cn("max-w-[85%] rounded-xl p-3 text-sm", n.isStaff ? "bg-surface-2" : "ms-auto bg-primary/10")}
            >
              <p>{n.body}</p>
              <p className="mt-1 text-[11px] text-muted">{n.createdAt}</p>
            </div>
          ))}
        </div>
        {!stopped && (
          <form action={action} className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            <input type="hidden" name="ref" value={order.ref} />
            <input type="hidden" name="locale" value={locale} />
            <textarea
              name="body"
              rows={2}
              placeholder={dict.noteBody}
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <button type="submit" disabled={pending} className="self-start rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {dict.send}
            </button>
            {!state.ok && state.code && <span className="text-xs font-bold text-red-500">{state.code}</span>}
          </form>
        )}
      </div>
    </div>
  );
}
