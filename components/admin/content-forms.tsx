"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  savePage,
  deletePage,
  savePost,
  deletePost,
  saveFaq,
  deleteFaq,
  saveSettings,
  saveApiSettings,
  saveReEngagementSettings,
  type ContentState,
} from "@/lib/actions/content";
import { ConfirmButton } from "@/components/ui/confirm-button";

const FIELD =
  "h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary/50";
const AREA =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50";
const BTN =
  "rounded-xl brand-gradient px-5 py-2 text-sm font-bold text-white disabled:opacity-60";
const DEL =
  "rounded-xl border border-border px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10";

type Errors = Dictionary["admin"]["content"]["errors"];
type Confirm = Dictionary["admin"]["confirm"];

function Status({ state, saved, errors }: { state: ContentState; saved: string; errors: Errors }) {
  if (state.ok && state.code === "saved")
    return <span className="text-sm font-bold text-emerald-500">{saved}</span>;
  if (!state.ok && state.code)
    return (
      <span className="text-sm font-bold text-red-500">
        {(errors as Record<string, string>)[state.code] ?? errors.invalid_input}
      </span>
    );
  return null;
}

// --- CMS page --------------------------------------------------------------

export type PageRow = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  published: boolean;
};

export function PageForm({
  locale,
  dict,
  confirm,
  errors,
  page,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["content"]["pages"];
  confirm: Confirm;
  errors: Errors;
  page?: PageRow;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(savePage, { ok: false });
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="locale" value={locale} />
      {page && <input type="hidden" name="id" value={page.id} />}
      <div className="flex items-center justify-between">
        <p className="font-bold">{page ? page.titleEn : dict.add}</p>
        <Status state={state} saved={dict.saved} errors={errors} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.slug}</span>
          <input name="slug" defaultValue={page?.slug} required pattern="[a-z0-9-]+" className={FIELD} />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={page?.published ?? true} className="size-4 accent-[var(--color-primary)]" />
          {dict.published}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.titleEn}</span>
          <input name="titleEn" defaultValue={page?.titleEn} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.titleAr}</span>
          <input name="titleAr" defaultValue={page?.titleAr} dir="rtl" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.bodyEn}</span>
          <textarea name="bodyEn" rows={6} defaultValue={page?.bodyEn} className={AREA} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.bodyAr}</span>
          <textarea name="bodyAr" rows={6} dir="rtl" defaultValue={page?.bodyAr} className={AREA} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={BTN}>{dict.save}</button>
        {page && (
          <ConfirmButton action={deletePage} hidden={{ id: page.id, locale }} title={confirm.deleteTitle} body={confirm.deleteBody} confirmText={confirm.yes} cancelText={confirm.no} className={DEL}>
            {dict.delete}
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}

// --- Blog post -------------------------------------------------------------

export type PostRow = PageRow & { excerptEn: string; excerptAr: string };

export function PostForm({
  locale,
  dict,
  confirm,
  errors,
  post,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["content"]["blog"];
  confirm: Confirm;
  errors: Errors;
  post?: PostRow;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(savePost, { ok: false });
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="locale" value={locale} />
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="flex items-center justify-between">
        <p className="font-bold">{post ? post.titleEn : dict.add}</p>
        <Status state={state} saved={dict.saved} errors={errors} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.slug}</span>
          <input name="slug" defaultValue={post?.slug} required pattern="[a-z0-9-]+" className={FIELD} />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={post?.published ?? true} className="size-4 accent-[var(--color-primary)]" />
          {dict.published}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.titleEn}</span>
          <input name="titleEn" defaultValue={post?.titleEn} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.titleAr}</span>
          <input name="titleAr" defaultValue={post?.titleAr} dir="rtl" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.excerptEn}</span>
          <input name="excerptEn" defaultValue={post?.excerptEn} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.excerptAr}</span>
          <input name="excerptAr" defaultValue={post?.excerptAr} dir="rtl" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.bodyEn}</span>
          <textarea name="bodyEn" rows={6} defaultValue={post?.bodyEn} className={AREA} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.bodyAr}</span>
          <textarea name="bodyAr" rows={6} dir="rtl" defaultValue={post?.bodyAr} className={AREA} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={BTN}>{dict.save}</button>
        {post && (
          <ConfirmButton action={deletePost} hidden={{ id: post.id, locale }} title={confirm.deleteTitle} body={confirm.deleteBody} confirmText={confirm.yes} cancelText={confirm.no} className={DEL}>
            {dict.delete}
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}

// --- Help FAQ --------------------------------------------------------------

export type FaqRow = {
  id: string;
  categoryKey: string;
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
  sortOrder: number;
};

export function FaqForm({
  locale,
  dict,
  confirm,
  errors,
  faq,
  categories,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["content"]["faqs"];
  confirm: Confirm;
  errors: Errors;
  faq?: FaqRow;
  categories: string[];
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(saveFaq, { ok: false });
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="locale" value={locale} />
      {faq && <input type="hidden" name="id" value={faq.id} />}
      <div className="flex items-center justify-between">
        <p className="font-bold">{faq ? faq.qEn : dict.add}</p>
        <Status state={state} saved={dict.saved} errors={errors} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.category}</span>
          <select name="categoryKey" defaultValue={faq?.categoryKey ?? categories[0]} className={FIELD}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.order}</span>
          <input name="sortOrder" type="number" defaultValue={faq?.sortOrder ?? 0} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.qEn}</span>
          <input name="qEn" defaultValue={faq?.qEn} required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.qAr}</span>
          <input name="qAr" defaultValue={faq?.qAr} dir="rtl" required className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.aEn}</span>
          <textarea name="aEn" rows={3} defaultValue={faq?.aEn} className={AREA} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.aAr}</span>
          <textarea name="aAr" rows={3} dir="rtl" defaultValue={faq?.aAr} className={AREA} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={BTN}>{dict.save}</button>
        {faq && (
          <ConfirmButton action={deleteFaq} hidden={{ id: faq.id, locale }} title={confirm.deleteTitle} body={confirm.deleteBody} confirmText={confirm.yes} cancelText={confirm.no} className={DEL}>
            {dict.delete}
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}

// --- Store settings --------------------------------------------------------

export type SettingsRow = {
  logo: string | null;
  favicon: string | null;
  whatsapp: string | null;
  telegram: string | null;
  supportEmail: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
};

export function SettingsForm({
  locale,
  dict,
  errors,
  settings,
}: {
  locale: Locale;
  dict: Dictionary["admin"]["content"]["settings"];
  errors: Errors;
  settings: SettingsRow;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(saveSettings, { ok: false });
  const fields: Array<[keyof SettingsRow, string, string]> = [
    ["whatsapp", dict.whatsapp, "+249…"],
    ["telegram", dict.telegram, "@wanbai"],
    ["supportEmail", dict.supportEmail, "support@wanbai.store"],
    ["facebook", dict.facebook, "https://facebook.com/…"],
    ["instagram", dict.instagram, "https://instagram.com/…"],
    ["youtube", dict.youtube, "https://youtube.com/…"],
    ["tiktok", dict.tiktok, "https://tiktok.com/@…"],
  ];
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <input type="hidden" name="locale" value={locale} />
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold">{dict.title}</h3>
        <Status state={state} saved={dict.saved} errors={errors} />
      </div>

      {/* Logo upload */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-2 p-4">
        <span className="text-xs font-semibold text-muted">{dict.logo}</span>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.logo || "/logo.svg"}
            alt={dict.currentLogo}
            className="size-14 shrink-0 rounded-xl border border-border bg-background object-contain p-1"
          />
          <div className="flex flex-1 flex-col gap-2">
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-primary"
            />
            <span className="text-[11px] text-muted">{dict.logoHint}</span>
            {settings.logo && (
              <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                <input type="checkbox" name="removeLogo" />
                {dict.removeLogo}
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Favicon upload */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-2 p-4">
        <span className="text-xs font-semibold text-muted">{dict.favicon}</span>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.favicon || "/icon.svg"}
            alt={dict.currentFavicon}
            className="size-14 shrink-0 rounded-xl border border-border bg-background object-contain p-1"
          />
          <div className="flex flex-1 flex-col gap-2">
            <input
              type="file"
              name="favicon"
              accept="image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,.ico"
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-primary"
            />
            <span className="text-[11px] text-muted">{dict.faviconHint}</span>
            {settings.favicon && (
              <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                <input type="checkbox" name="removeFavicon" />
                {dict.removeFavicon}
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([key, label, ph]) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">{label}</span>
            <input name={key} defaultValue={settings[key] ?? ""} placeholder={ph} dir="ltr" className={FIELD} />
          </label>
        ))}
      </div>
      <button type="submit" disabled={pending} className={`self-start ${BTN}`}>{dict.save}</button>
    </form>
  );
}

// --- Game/product API integration (staged) ----------------------------------

export type ApiSettingsRow = {
  gameApiEnabled: boolean;
  gameApiBaseUrl: string | null;
  gameApiKey: string | null;
  hasSecret: boolean;
};

export function ApiSettingsForm({
  dict,
  errors,
  settings,
}: {
  dict: Dictionary["admin"]["content"]["apiSettings"];
  errors: Errors;
  settings: ApiSettingsRow;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(saveApiSettings, {
    ok: false,
  });

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold">{dict.title}</h3>
          <p className="mt-0.5 text-xs text-muted">{dict.subtitle}</p>
        </div>
        <Status state={state} saved={dict.saved} errors={errors} />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="gameApiEnabled" defaultChecked={settings.gameApiEnabled} />
        {dict.enabled}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.baseUrl}</span>
        <input
          name="gameApiBaseUrl"
          defaultValue={settings.gameApiBaseUrl ?? ""}
          placeholder="https://api.provider.com"
          dir="ltr"
          className={FIELD}
        />
        <span className="text-[11px] text-muted">{dict.baseUrlHint}</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.apiKey}</span>
        <input
          name="gameApiKey"
          defaultValue={settings.gameApiKey ?? ""}
          dir="ltr"
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">{dict.secret}</span>
        <input
          name="gameApiSecret"
          type="password"
          placeholder={settings.hasSecret ? dict.secretSet : ""}
          dir="ltr"
          className={FIELD}
          autoComplete="new-password"
        />
        <span className="text-[11px] text-muted">{dict.secretHint}</span>
      </label>

      <button type="submit" disabled={pending} className={`self-start ${BTN}`}>{dict.save}</button>
    </form>
  );
}

// --- Re-engagement ("come back") email settings ------------------------------

export type ReEngagementRow = {
  enabled: boolean;
  inactiveDays: number;
  maxSends: number;
  intervalDays: number;
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
};

export function ReEngagementForm({
  dict,
  errors,
  settings,
}: {
  dict: Dictionary["admin"]["reengagement"];
  errors: Errors;
  settings: ReEngagementRow;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    saveReEngagementSettings,
    { ok: false },
  );

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold">{dict.title}</h3>
          <p className="mt-0.5 text-xs text-muted">{dict.subtitle}</p>
        </div>
        <Status state={state} saved={dict.saved} errors={errors} />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="enabled" defaultChecked={settings.enabled} />
        {dict.enabled}
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.inactiveDays}</span>
          <input
            name="inactiveDays"
            type="number"
            min={1}
            max={365}
            defaultValue={settings.inactiveDays}
            className={FIELD}
          />
          <span className="text-[11px] text-muted">{dict.inactiveDaysHint}</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.maxSends}</span>
          <input
            name="maxSends"
            type="number"
            min={1}
            max={20}
            defaultValue={settings.maxSends}
            className={FIELD}
          />
          <span className="text-[11px] text-muted">{dict.maxSendsHint}</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{dict.intervalDays}</span>
          <input
            name="intervalDays"
            type="number"
            min={1}
            max={365}
            defaultValue={settings.intervalDays}
            className={FIELD}
          />
          <span className="text-[11px] text-muted">{dict.intervalDaysHint}</span>
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-3">
        <span className="text-xs font-semibold text-muted">{dict.messageEn}</span>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted">{dict.subjectEn}</span>
          <input name="subjectEn" defaultValue={settings.subjectEn} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted">{dict.bodyEn}</span>
          <textarea name="bodyEn" rows={2} defaultValue={settings.bodyEn} className={AREA} />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-3">
        <span className="text-xs font-semibold text-muted">{dict.messageAr}</span>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted">{dict.subjectAr}</span>
          <input name="subjectAr" defaultValue={settings.subjectAr} dir="rtl" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted">{dict.bodyAr}</span>
          <textarea name="bodyAr" rows={2} dir="rtl" defaultValue={settings.bodyAr} className={AREA} />
        </label>
      </div>

      <p className="text-xs text-muted">{dict.note}</p>
      <p className="rounded-xl bg-surface-2 p-3 text-xs text-muted">{dict.cronNote}</p>

      <button type="submit" disabled={pending} className={`self-start ${BTN}`}>{dict.save}</button>
    </form>
  );
}
