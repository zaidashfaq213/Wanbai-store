"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { adminReplyTicket, type SupportState } from "@/lib/actions/support";

export function AdminTicketReplyForm({
  locale,
  dict,
  ticketId,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["content"]["tickets"];
  ticketId: string;
}) {
  const [state, action, pending] = useActionState<SupportState, FormData>(
    adminReplyTicket,
    { ok: false },
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="ticketId" value={ticketId} />
      {!state.ok && state.code && (
        <p className="text-sm font-medium text-red-500">{state.code}</p>
      )}
      <textarea
        name="body"
        required
        rows={4}
        placeholder={dict.replyPlaceholder}
        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
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
