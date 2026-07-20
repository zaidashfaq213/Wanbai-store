"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { logoutAction } from "@/lib/auth/actions";

type Labels = {
  logout: string;
  logoutTitle: string;
  logoutBody: string;
  logoutConfirm: string;
  logoutCancel: string;
};

/**
 * Logout trigger that asks for confirmation first. On confirm it submits the
 * real logout server action (via a hidden form) so the session is cleared.
 */
export function LogoutButton({
  locale,
  labels,
  className,
}: {
  locale: Locale;
  labels: Labels;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "w-full rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
        }
      >
        {labels.logout}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-pop)]">
            <h2 className="text-base font-black">{labels.logoutTitle}</h2>
            <p className="mt-1.5 text-sm text-muted">{labels.logoutBody}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-surface-2"
              >
                {labels.logoutCancel}
              </button>
              <form action={logoutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
                >
                  {labels.logoutConfirm}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
