import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminTickets } from "@/lib/data/content";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

const TABS = ["OPEN", "ANSWERED", "CLOSED"] as const;
const TINT: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-500",
  ANSWERED: "bg-emerald-500/10 text-emerald-500",
  CLOSED: "bg-muted/10 text-muted",
};

export default async function AdminTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { lang } = await params;
  const { status } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.content.tickets;
  const statuses = d.statuses as Record<string, string>;

  const filter = (TABS as readonly string[]).includes(status ?? "")
    ? (status as (typeof TABS)[number])
    : undefined;
  const tickets = await getAdminTickets(filter);

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/admin/tickets`}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            !filter ? "bg-primary/10 text-primary" : "border border-border hover:bg-surface-2",
          )}
        >
          {d.all}
        </Link>
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/${locale}/admin/tickets?status=${t}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              filter === t ? "bg-primary/10 text-primary" : "border border-border hover:bg-surface-2",
            )}
          >
            {statuses[t]}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {d.none}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/${locale}/admin/tickets/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{t.subject}</p>
                  <p className="text-xs text-muted">
                    {t.ref} · {t.user.name ?? t.user.email} · {t._count.messages}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", TINT[t.status])}>
                  {statuses[t.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
