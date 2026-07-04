import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getNotifications } from "@/lib/data/account";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/account";
import { cn } from "@/lib/utils";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const user = await requireUser(locale);
  const dict = await getDictionary(locale);
  const d = dict.dashboard.notifications;
  const notifications = await getNotifications(user.id);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{d.title}</h2>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="text-sm font-bold text-primary hover:underline">
              {d.markAllRead}
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
          {d.empty}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
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
                      locale === "ar" ? "ar-EG" : "en-US",
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
