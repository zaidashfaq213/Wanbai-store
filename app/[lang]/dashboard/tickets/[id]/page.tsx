import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getUserTicket } from "@/lib/data/content";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReplyForm } from "@/components/dashboard/ticket-forms";

const STATUS_TINT: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-500",
  ANSWERED: "bg-emerald-500/10 text-emerald-500",
  CLOSED: "bg-muted/10 text-muted",
};

export default async function TicketThreadPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const [user, dict] = await Promise.all([requireUser(locale), getDictionary(locale)]);
  const t = dict.dashboard.tickets;
  const statuses = t.statuses as Record<string, string>;

  const ticket = await getUserTicket(id, user.id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${locale}/dashboard/tickets`}
        className="mb-3 inline-block text-sm font-semibold text-muted hover:text-primary"
      >
        ← {t.title}
      </Link>

      <PageHeader
        title={ticket.subject}
        subtitle={ticket.ref}
        action={
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", STATUS_TINT[ticket.status])}>
            {statuses[ticket.status]}
          </span>
        }
      />

      <ul className="mb-5 flex flex-col gap-3">
        {ticket.messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              "rounded-2xl border p-4",
              m.isStaff
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-surface",
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-bold">
                {m.isStaff ? t.support : (m.author?.name ?? t.you)}
              </span>
              <span className="text-xs text-muted">
                {new Date(m.createdAt).toLocaleString(
                  locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
                )}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm">{m.body}</p>
          </li>
        ))}
      </ul>

      {ticket.status === "CLOSED" ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-4 text-center text-sm text-muted">
          {t.closed}
        </p>
      ) : (
        <ReplyForm locale={locale} dict={t} ticketId={ticket.id} />
      )}
    </div>
  );
}
