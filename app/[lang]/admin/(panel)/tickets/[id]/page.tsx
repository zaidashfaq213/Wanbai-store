import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminTicket } from "@/lib/data/content";
import { setTicketStatus } from "@/lib/actions/support";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminTicketReplyForm } from "@/components/admin/ticket-reply-form";

const TINT: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-500",
  ANSWERED: "bg-emerald-500/10 text-emerald-500",
  CLOSED: "bg-muted/10 text-muted",
};

export default async function AdminTicketThreadPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.content.tickets;
  const statuses = d.statuses as Record<string, string>;

  const ticket = await getAdminTicket(id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${locale}/admin/tickets`}
        className="mb-3 inline-block text-sm font-semibold text-muted hover:text-primary"
      >
        ← {d.title}
      </Link>

      <PageHeader
        title={ticket.subject}
        subtitle={`${ticket.ref} · ${ticket.user.name ?? ticket.user.email}`}
        action={
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", TINT[ticket.status])}>
              {statuses[ticket.status]}
            </span>
            <form action={setTicketStatus}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input
                type="hidden"
                name="status"
                value={ticket.status === "CLOSED" ? "OPEN" : "CLOSED"}
              />
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-surface-2"
              >
                {ticket.status === "CLOSED" ? d.reopen : d.close}
              </button>
            </form>
          </div>
        }
      />

      <ul className="mb-5 flex flex-col gap-3">
        {ticket.messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              "rounded-2xl border p-4",
              m.isStaff ? "border-primary/30 bg-primary/5" : "border-border bg-surface",
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-bold">
                {m.isStaff ? d.you : (m.author?.name ?? d.customer)}
              </span>
              <span className="text-xs text-muted">
                {new Date(m.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm">{m.body}</p>
          </li>
        ))}
      </ul>

      <AdminTicketReplyForm locale={locale} dict={d} ticketId={ticket.id} />
    </div>
  );
}
