"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createTicket, replyTicket, type SupportState } from "@/lib/actions/support";

const FIELD =
  "h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none focus:border-primary/50";
const AREA =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50";

type TicketDict = Dictionary["dashboard"]["tickets"];

export function NewTicketForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: TicketDict;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SupportState, FormData>(
    createTicket,
    { ok: false },
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl brand-gradient px-4 py-2 text-sm font-bold text-white"
      >
        {dict.new}
      </button>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="locale" value={locale} />
      {!state.ok && state.code && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
          {dict.error}
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.subject}</span>
        <input name="subject" required minLength={4} maxLength={120} className={FIELD} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.message}</span>
        <textarea name="body" required minLength={10} rows={5} className={AREA} />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {dict.send}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-surface-2">
          ✕
        </button>
      </div>
    </form>
  );
}

export function ReplyForm({
  locale,
  dict,
  ticketId,
}: {
  locale: Locale;
  dict: TicketDict;
  ticketId: string;
}) {
  const [state, action, pending] = useActionState<SupportState, FormData>(
    replyTicket,
    { ok: false },
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="ticketId" value={ticketId} />
      {!state.ok && state.code && (
        <p className="text-sm font-medium text-red-500">{dict.error}</p>
      )}
      <textarea
        name="body"
        required
        rows={3}
        placeholder={dict.replyPlaceholder}
        className={AREA}
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {dict.reply}
      </button>
    </form>
  );
}
