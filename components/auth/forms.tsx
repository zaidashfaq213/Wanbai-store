"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  loginAction,
  signupAction,
  requestPasswordResetAction,
  resetPasswordAction,
  verifyEmailAction,
  resendCodeAction,
  oauthLoginAction,
  type FormState,
} from "@/lib/auth/actions";

const FIELD =
  "h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:bg-surface";
const SUBMIT =
  "flex w-full items-center justify-center rounded-xl brand-gradient py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100";

type AuthDict = Dictionary["auth"];

function ErrorNote({ dict, code }: { dict: AuthDict; code?: string }) {
  if (!code) return null;
  const msg = (dict.errors as Record<string, string>)[code] ?? dict.errors.server_error;
  return (
    <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
      {msg}
    </p>
  );
}

const OAUTH_BTN =
  "flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface py-3 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-surface-2 hover:shadow active:scale-[0.99]";

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2c-.27 1.44-1.08 2.66-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.56z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1.03 7.6-2.79l-3.72-2.9c-1.03.69-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.75v2.99C3.64 21.44 7.53 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.69A7.2 7.2 0 0 1 5.22 12c0-.93.16-1.84.38-2.69V6.32H1.75A11.98 11.98 0 0 0 .48 12c0 1.94.46 3.77 1.27 5.68l3.85-2.99z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.68 0 3.19.58 4.38 1.72l3.29-3.29C17.7 1.19 15.1 0 12 0 7.53 0 3.64 2.56 1.75 6.32l3.85 2.99C6.5 6.76 9.02 4.75 12 4.75z"
      />
    </svg>
  );
}

export function OAuthButtons({ dict, locale }: { dict: AuthDict; locale: Locale }) {
  return (
    <div className="flex flex-col gap-2.5">
      <form action={oauthLoginAction}>
        <input type="hidden" name="provider" value="google" />
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className={OAUTH_BTN}>
          <GoogleGlyph className="size-5" />
          {dict.login.continueGoogle}
        </button>
      </form>
      <div className="my-1 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        {dict.login.or}
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

export function LoginForm({
  dict,
  locale,
  verified,
  oauthError,
  next,
  hideOAuth,
}: {
  dict: AuthDict;
  locale: Locale;
  verified?: boolean;
  oauthError?: boolean;
  next?: string;
  hideOAuth?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    loginAction,
    { ok: false },
  );
  return (
    <div className="flex flex-col gap-4">
      {verified && (
        <p className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium text-emerald-500">
          {dict.verify.verifiedBanner}
        </p>
      )}
      {oauthError && <ErrorNote dict={dict} code="oauth_unavailable" />}
      {!hideOAuth && <OAuthButtons dict={dict} locale={locale} />}
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <ErrorNote dict={dict} code={state.ok ? undefined : state.code} />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.login.email}</span>
          <input name="email" type="email" autoComplete="email" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.login.password}</span>
          <input name="password" type="password" autoComplete="current-password" required className={FIELD} />
        </label>
        <div className="text-end">
          <Link href={`/${locale}/forgot-password`} className="text-xs font-semibold text-primary hover:underline">
            {dict.login.forgot}
          </Link>
        </div>
        <button type="submit" disabled={pending} className={SUBMIT}>
          {dict.login.submit}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        {dict.login.noAccount}{" "}
        <Link href={`/${locale}/signup`} className="font-bold text-primary hover:underline">
          {dict.login.createAccount}
        </Link>
      </p>
    </div>
  );
}

export function SignupForm({
  dict,
  locale,
}: {
  dict: AuthDict;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signupAction,
    { ok: false },
  );
  return (
    <div className="flex flex-col gap-4">
      <OAuthButtons dict={dict} locale={locale} />
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <ErrorNote dict={dict} code={state.ok ? undefined : state.code} />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.signup.name}</span>
          <input name="name" type="text" autoComplete="name" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.signup.username}</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9_]+"
            placeholder={dict.signup.usernamePlaceholder}
            className={FIELD}
          />
          <span className="text-[11px] text-muted">{dict.signup.usernameHint}</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.signup.email}</span>
          <input name="email" type="email" autoComplete="email" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.signup.password}</span>
          <input name="password" type="password" autoComplete="new-password" required minLength={8} className={FIELD} />
          <span className="text-[11px] text-muted">{dict.passwordHint}</span>
        </label>
        <button type="submit" disabled={pending} className={SUBMIT}>
          {dict.signup.submit}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        {dict.signup.haveAccount}{" "}
        <Link href={`/${locale}/login`} className="font-bold text-primary hover:underline">
          {dict.signup.signIn}
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm({ dict, locale }: { dict: AuthDict; locale: Locale }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    { ok: false },
  );
  if (state.ok && state.code === "reset_sent") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          {dict.forgot.sentBody}
        </p>
        <Link href={`/${locale}/login`} className="text-sm font-bold text-primary hover:underline">
          {dict.forgot.backToLogin}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="locale" value={locale} />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.forgot.email}</span>
        <input name="email" type="email" autoComplete="email" required className={FIELD} />
      </label>
      <button type="submit" disabled={pending} className={SUBMIT}>
        {dict.forgot.submit}
      </button>
      <Link href={`/${locale}/login`} className="text-center text-sm font-semibold text-primary hover:underline">
        {dict.forgot.backToLogin}
      </Link>
    </form>
  );
}

export function ResetPasswordForm({
  dict,
  locale,
  token,
}: {
  dict: AuthDict;
  locale: Locale;
  token: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resetPasswordAction,
    { ok: false },
  );

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
          {dict.reset.invalidBody}
        </p>
        <Link href={`/${locale}/forgot-password`} className="text-sm font-bold text-primary hover:underline">
          {dict.forgot.title}
        </Link>
      </div>
    );
  }

  if (state.ok && state.code === "reset_success") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          {dict.reset.successBody}
        </p>
        <Link href={`/${locale}/login`} className="text-sm font-bold text-primary hover:underline">
          {dict.reset.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <ErrorNote dict={dict} code={state.ok ? undefined : state.code} />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.reset.password}</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className={FIELD} />
        <span className="text-[11px] text-muted">{dict.passwordHint}</span>
      </label>
      <button type="submit" disabled={pending} className={SUBMIT}>
        {dict.reset.submit}
      </button>
    </form>
  );
}

export function VerifyEmailForm({
  dict,
  locale,
  email,
  notice,
}: {
  dict: AuthDict;
  locale: Locale;
  email: string;
  notice?: "unverified";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    verifyEmailAction,
    { ok: false },
  );
  const [resend, resendAction, resending] = useActionState<FormState, FormData>(
    resendCodeAction,
    { ok: false },
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-primary/5 px-3.5 py-2.5 text-sm font-medium text-primary">
        {notice === "unverified" ? dict.verify.unverifiedNotice : dict.verify.sentTo}{" "}
        <span className="font-bold">{email}</span>
      </p>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="email" value={email} />
        <ErrorNote dict={dict} code={state.ok ? undefined : state.code} />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{dict.verify.codeLabel}</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="••••••"
            className={`${FIELD} text-center text-2xl font-black tracking-[0.5em]`}
          />
        </label>
        <button type="submit" disabled={pending} className={SUBMIT}>
          {dict.verify.submit}
        </button>
      </form>

      <form action={resendAction} className="text-center">
        <input type="hidden" name="email" value={email} />
        {resend.ok && resend.code === "code_sent" ? (
          <p className="text-sm font-medium text-emerald-500">{dict.verify.resent}</p>
        ) : (
          <button
            type="submit"
            disabled={resending}
            className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
          >
            {dict.verify.resend}
          </button>
        )}
      </form>

      <p className="rounded-xl border border-dashed border-border px-3.5 py-2.5 text-center text-xs leading-relaxed text-muted">
        {dict.verify.spamHint}
      </p>

      <Link
        href={`/${locale}/login`}
        className="text-center text-sm font-semibold text-muted hover:text-primary"
      >
        {dict.login.title}
      </Link>
    </div>
  );
}
