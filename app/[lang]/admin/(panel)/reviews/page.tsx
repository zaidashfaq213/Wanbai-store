import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminReviews } from "@/lib/data/content";
import { deleteReview, toggleReviewApproval } from "@/lib/actions/content";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StarIcon } from "@/components/ui/icons";
import { ConfirmButton } from "@/components/ui/confirm-button";

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.content.reviews;
  const reviews = await getAdminReviews();

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {d.none}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{r.name}</p>
                  <p className="text-xs text-muted">
                    {d.product}: {r.product.nameEn} · {r.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        className={cn(
                          "size-4",
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted",
                        )}
                      />
                    ))}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-bold",
                      r.approved
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-muted/10 text-muted",
                    )}
                  >
                    {r.approved ? d.approved : d.hidden}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm">{r.commentEn}</p>

              <div className="mt-3 flex gap-2">
                <form action={toggleReviewApproval}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-surface-2"
                  >
                    {r.approved ? d.unapprove : d.approve}
                  </button>
                </form>
                <ConfirmButton
                  action={deleteReview}
                  hidden={{ id: r.id, locale }}
                  title={dict.admin.confirm.deleteTitle}
                  body={dict.admin.confirm.deleteBody}
                  confirmText={dict.admin.confirm.yes}
                  cancelText={dict.admin.confirm.no}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10"
                >
                  {d.delete}
                </ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
