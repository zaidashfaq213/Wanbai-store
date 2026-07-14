"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/config";
import { sendOrderMessage, adminReplyOrder, type SupportState } from "@/lib/actions/support";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  isStaff: boolean;
  body: string;
  createdAt: string | Date;
  author?: { name: string | null } | null;
};

export type ChatLabels = {
  title: string;
  subtitle: string;
  you: string;
  support: string;
  empty: string;
  placeholder: string;
  send: string;
  error: string;
};

/**
 * Order thread shared by the customer dashboard and the admin panel. The only
 * difference is which side the bubbles land on and which action posts them.
 */
export function OrderChat({
  locale,
  orderRef,
  messages,
  labels,
  variant,
}: {
  locale: Locale;
  orderRef: string;
  messages: ChatMessage[];
  labels: ChatLabels;
  variant: "user" | "admin";
}) {
  const [state, action, pending] = useActionState<SupportState, FormData>(
    variant === "admin" ? adminReplyOrder : sendOrderMessage,
    { ok: false },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Clear the box once the server confirms the message landed.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const dateFmt = locale === "ar" ? "ar-EG" : "en-US";

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-base font-black">{labels.title}</h2>
        <p className="text-xs text-muted">{labels.subtitle}</p>
      </header>

      <div className="mb-4 flex max-h-[26rem] flex-col gap-3 overflow-y-auto pe-1">
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            {labels.empty}
          </p>
        ) : (
          messages.map((m) => {
            // "Mine" = written by whoever is looking at this thread.
            const mine = variant === "admin" ? m.isStaff : !m.isStaff;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex max-w-[85%] flex-col gap-1",
                  mine ? "self-end items-end" : "self-start items-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm",
                    mine
                      ? "brand-gradient text-white"
                      : "border border-border bg-surface-2",
                  )}
                >
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                </div>
                <span className="px-1 text-[11px] text-muted">
                  {m.isStaff ? labels.support : (m.author?.name ?? labels.you)} ·{" "}
                  {new Date(m.createdAt).toLocaleString(dateFmt, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form ref={formRef} action={action} className="flex flex-col gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="orderRef" value={orderRef} />
        {!state.ok && state.code && (
          <p className="text-sm font-medium text-red-500">{labels.error}</p>
        )}
        <textarea
          name="body"
          required
          rows={3}
          maxLength={4000}
          placeholder={labels.placeholder}
          className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {labels.send}
        </button>
      </form>
    </section>
  );
}
