import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getNotifications } from "@/lib/data/account";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/account";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { BellIcon } from "@/components/ui/icons";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict] = await Promise.all([requireUser(locale), getDictionary(locale)]);
  const d = dict.dashboard.notifications;
  const notifications = await getNotifications(user.id);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div>
      <PageHeader
        title={d.title}
        subtitle={d.subtitle}
        action={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-2"
              >
                {d.markAllRead}
              </button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
            <BellIcon className="size-7" />
          </span>
          <p className="text-sm text-muted">{d.empty}</p>
        </div>
      ) : (
        <ul className="mx-auto flex max-w-3xl flex-col gap-2">
          {notifications.map((n) => {
            const body = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                  n.read
                    ? "border-border bg-surface"
                    : "border-primary/30 bg-primary/5",
                )}
              >
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.title}</p>
                  {n.body && <p className="text-sm text-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {new Date(n.createdAt).toLocaleString(
                      locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
                    )}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.href ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button type="submit" className="w-full text-start">
                      {body}
                    </button>
                  </form>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={`/${locale}/dashboard`}
        className="mt-1 text-center text-sm font-semibold text-muted hover:text-primary"
      >
        ← {dict.dashboard.nav.overview}
      </Link>
    </div>
  );
}
