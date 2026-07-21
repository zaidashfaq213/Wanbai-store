"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createStaff, setUserRole, type AdminState } from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";

type StaffRow = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
};

export function StaffManager({
  locale,
  dict,
  errors,
  confirm,
  adminId,
  staff,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["staff"];
  errors: Dictionary["auth"]["errors"];
  confirm: Dictionary["admin"]["confirm"];
  adminId: string;
  staff: StaffRow[];
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(createStaff, {
    ok: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.code === "created") formRef.current?.reset();
  }, [state]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Create staff */}
      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
      >
        <input type="hidden" name="locale" value={locale} />
        <h3 className="font-extrabold">{dict.create}</h3>

        {!state.ok && state.code && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
            {(errors as Record<string, string>)[state.code] ?? errors.invalid_input}
          </p>
        )}
        {state.ok && state.code === "created" && (
          <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-500">
            {dict.created}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.name}</span>
            <input name="name" required minLength={2} className={FIELD} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.username}</span>
            <input name="username" required minLength={3} pattern="[a-z0-9_]+" dir="ltr" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.email}</span>
            <input name="email" type="email" required dir="ltr" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{dict.password}</span>
            <input name="password" type="password" required minLength={8} dir="ltr" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold text-muted">{dict.role}</span>
            <select name="role" defaultValue="MANAGER" className={FIELD}>
              <option value="MANAGER">{dict.roleManager}</option>
              <option value="ADMIN">{dict.roleSupervisor}</option>
            </select>
          </label>
        </div>

        <p className="text-xs text-muted">{dict.roleHint}</p>
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-xl brand-gradient px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {dict.add}
        </button>
      </form>

      {/* Existing staff */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-extrabold">{dict.existing}</h3>
        {staff.length === 0 ? (
          <p className="text-sm text-muted">{dict.none}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {staff.map((s) => {
              const isSelf = s.id === adminId;
              const isSupervisor = s.role === "ADMIN";
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 p-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold">
                      {s.name ?? s.username ?? s.email}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isSupervisor
                            ? "bg-primary/10 text-primary"
                            : "bg-amber-500/10 text-amber-500",
                        )}
                      >
                        {isSupervisor ? dict.roleSupervisor : dict.roleManager}
                      </span>
                      {isSelf && <span className="text-[10px] text-muted">({dict.you})</span>}
                    </p>
                    <p className="truncate text-xs text-muted" dir="ltr">{s.email}</p>
                  </div>

                  {!isSelf && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <form action={setUserRole}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="userId" value={s.id} />
                        <input type="hidden" name="role" value={isSupervisor ? "MANAGER" : "ADMIN"} />
                        <button
                          type="submit"
                          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold hover:bg-surface"
                        >
                          {isSupervisor ? dict.makeManager : dict.makeSupervisor}
                        </button>
                      </form>
                      <ConfirmButton
                        action={setUserRole}
                        hidden={{ locale, userId: s.id, role: "USER" }}
                        title={dict.confirmRevokeTitle}
                        body={dict.confirmRevokeBody}
                        confirmText={confirm.yes}
                        cancelText={confirm.no}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10"
                      >
                        {dict.revoke}
                      </ConfirmButton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
