"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type FieldValue = string | number | boolean | null | undefined;

/**
 * A destructive trigger that asks for confirmation before running its server
 * action. On confirm it submits a hidden form (with the given fields) that
 * calls `action`. Use for delete / refund / reject and similar admin actions.
 */
export function ConfirmButton({
  action,
  hidden = {},
  children,
  title,
  body,
  confirmText,
  cancelText,
  className,
  confirmClassName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden?: Record<string, FieldValue>;
  children: React.ReactNode;
  title: string;
  body: string;
  confirmText: string;
  cancelText: string;
  className?: string;
  confirmClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
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
            <h2 className="text-base font-black">{title}</h2>
            <p className="mt-1.5 text-sm text-muted">{body}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-surface-2"
              >
                {cancelText}
              </button>
              <form action={action}>
                {Object.entries(hidden).map(([k, v]) =>
                  v === null || v === undefined ? null : (
                    <input key={k} type="hidden" name={k} value={String(v)} />
                  ),
                )}
                <button
                  type="submit"
                  className={
                    confirmClassName ??
                    "rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
                  }
                >
                  {confirmText}
                </button>
              </form>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
