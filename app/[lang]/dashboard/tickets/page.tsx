import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { getUserTickets } from "@/lib/data/content";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { NewTicketForm } from "@/components/dashboard/ticket-forms";
import { SupportIcon } from "@/components/ui/icons";

const STATUS_TINT: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-500",
  ANSWERED: "bg-emerald-500/10 text-emerald-500",
  CLOSED: "bg-muted/10 text-muted",
};

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const user = await requireUser(locale);
  const dict = await getDictionary(locale);
  const t = dict.dashboard.tickets;
  const statuses = t.statuses as Record<string, string>;
  const tickets = await getUserTickets(user.id);

  return (
    <div>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        action={<NewTicketForm locale={locale} dict={t} />}
      />

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
            <SupportIcon className="size-7" />
          </span>
          <p className="text-sm text-muted">{t.none}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/${locale}/dashboard/tickets/${ticket.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{ticket.subject}</p>
                  <p className="text-xs text-muted">
                    {ticket.ref} · {ticket._count.messages} ·{" "}
                    {new Date(ticket.updatedAt).toLocaleDateString(
                      locale === "ar" ? "ar-EG" : "en-US",
                    )}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                    STATUS_TINT[ticket.status],
                  )}
                >
                  {statuses[ticket.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
