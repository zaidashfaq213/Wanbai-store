"use client";

import type { Locale } from "@/lib/i18n/config";
import { logoutAction } from "@/lib/auth/actions";
import { ConfirmButton } from "./confirm-button";

type Labels = {
  logout: string;
  logoutTitle: string;
  logoutBody: string;
  logoutConfirm: string;
  logoutCancel: string;
};

/**
 * Logout trigger that asks for confirmation first. Built on ConfirmButton,
 * which renders its modal through a portal (document.body) — the sidebar has
 * transformed/scrolling ancestors that clip a plain `position: fixed` modal
 * rendered inline, which made the old implementation look "stuck" (clicks on
 * the confirm button didn't register). On confirm it submits the real logout
 * server action, which clears the session and redirects to the homepage.
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
  return (
    <ConfirmButton
      action={logoutAction}
      hidden={{ locale }}
      title={labels.logoutTitle}
      body={labels.logoutBody}
      confirmText={labels.logoutConfirm}
      cancelText={labels.logoutCancel}
      className={
        className ??
        "w-full rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
      }
    >
      {labels.logout}
    </ConfirmButton>
  );
}
