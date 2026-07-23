"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitContactMessage, type ContactFormState } from "@/lib/actions/contact";

const FIELD =
  "h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface";
const AREA =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface";

export type ContactFormDict = {
  formTitle: string;
  formSubtitle: string;
  name: string;
  emailAddress: string;
  subject: string;
  message: string;
  send: string;
  sending: string;
  sent: string;
  errorGeneric: string;
};

export function ContactForm({ dict }: { dict: ContactFormDict }) {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    submitContactMessage,
    { ok: false },
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.code === "sent") formRef.current?.reset();
  }, [state]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-black">{dict.formTitle}</h2>
      <p className="mt-1 text-sm text-muted">{dict.formSubtitle}</p>

      {state.ok && state.code === "sent" ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-emerald-500/15 text-2xl">✓</span>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{dict.sent}</p>
        </div>
      ) : (
        <form ref={formRef} action={action} className="mt-4 flex flex-col gap-3">
          {!state.ok && state.code && (
            <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
              {dict.errorGeneric}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">{dict.name}</span>
              <input name="name" required minLength={2} maxLength={80} className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">{dict.emailAddress}</span>
              <input name="email" type="email" required dir="ltr" className={FIELD} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">{dict.subject}</span>
            <input name="subject" required minLength={4} maxLength={120} className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">{dict.message}</span>
            <textarea name="message" required minLength={10} maxLength={4000} rows={5} className={AREA} />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-xl brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {pending ? dict.sending : dict.send}
          </button>
        </form>
      )}
    </div>
  );
}
