import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getSubmissions } from "@/lib/data/payments";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  PaymentReviewCard,
  type ReviewSubmission,
} from "@/components/admin/payment-review-card";

const TABS = ["PENDING", "APPROVED", "REJECTED"] as const;

export default async function AdminPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { lang } = await params;
  const { status, type } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const p = dict.admin.payments;
  const currency = await getCurrency();

  const active = (TABS as readonly string[]).includes(status ?? "")
    ? (status as (typeof TABS)[number])
    : "PENDING";
  const purpose = type === "WALLET_TOPUP" || type === "ORDER" ? type : undefined;
  const rows = await getSubmissions(active, purpose);
  const typeTabs: Array<{ key?: "WALLET_TOPUP" | "ORDER"; label: string }> = [
    { label: p.all },
    { key: "WALLET_TOPUP", label: p.topup },
    { key: "ORDER", label: p.order },
  ];

  const submissions: ReviewSubmission[] = rows.map((r) => ({
    id: r.id,
    purpose: r.purpose,
    amount: r.amount,
    status: r.status,
    senderName: r.senderName,
    reference: r.reference,
    createdAt: r.createdAt.toISOString(),
    proofUrl: r.proofUrl,
    bankName: locale === "ar" ? r.bankAccount.nameAr : r.bankAccount.nameEn,
    userName: r.user.name ?? r.user.username ?? r.user.email,
    userEmail: r.user.email,
    orderRef: r.order?.ref ?? null,
    adminNote: r.adminNote,
  }));

  const tabLabels: Record<string, string> = {
    PENDING: p.pending,
    APPROVED: p.approved,
    REJECTED: p.rejected,
  };
  const statusLabels: Record<string, string> = {
    PENDING: p.pending,
    APPROVED: p.approved,
    REJECTED: p.rejected,
  };

  return (
    <div>
      <PageHeader title={p.title} subtitle={p.subtitle} />

      <div className="mb-3 flex flex-wrap gap-2">
        {typeTabs.map((t) => {
          const isActive = purpose === t.key || (!purpose && !t.key);
          return (
            <Link
              key={t.label}
              href={`/${locale}/admin/payments?status=${active}${t.key ? `&type=${t.key}` : ""}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                isActive ? "bg-primary/10 text-primary" : "border border-border hover:bg-surface-2",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/${locale}/admin/payments?status=${t}${purpose ? `&type=${purpose}` : ""}`}
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
              active === t ? "brand-gradient text-white" : "border border-border bg-surface hover:bg-surface-2",
            )}
          >
            {tabLabels[t]}
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {p.none}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((s) => (
            <PaymentReviewCard
              key={s.id}
              submission={s}
              locale={locale}
              dict={p}
              statusLabels={statusLabels}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
