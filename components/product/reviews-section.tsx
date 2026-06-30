import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Review } from "@/lib/data/product-detail";
import { fmt } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";

export function ReviewsSection({
  rating,
  totalReviews,
  breakdown,
  reviews,
  locale,
  dict,
}: {
  rating: number;
  totalReviews: number;
  breakdown: number[];
  reviews: Review[];
  locale: Locale;
  dict: Dictionary;
}) {
  const sum = breakdown.reduce((a, b) => a + b, 0) || 1;

  return (
    <section>
      <h2 className="mb-5 text-xl font-black">{dict.product.reviewsTitle}</h2>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Score + breakdown */}
        <div className="rounded-2xl border border-border bg-surface p-5 text-center">
          <div className="text-5xl font-black text-primary">{rating.toFixed(1)}</div>
          <StarRating value={rating} size="size-5" className="mt-2 justify-center" />
          <p className="mt-1 text-sm text-muted">
            {fmt(dict.product.basedOn, { count: totalReviews })}
          </p>
          <div className="mt-4 flex flex-col gap-1.5">
            {breakdown.map((count, i) => {
              const stars = 5 - i;
              const pct = Math.round((count / sum) * 100);
              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted">{stars}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-warning"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-7 text-end text-muted">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual reviews */}
        <div className="flex flex-col gap-3">
          {reviews.map((review, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {review.name.charAt(0)}
                  </span>
                  <span className="font-bold">{review.name}</span>
                </div>
                <span className="text-xs text-muted">{review.date}</span>
              </div>
              <StarRating value={review.rating} size="size-3.5" className="mt-2" />
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {review.comment[locale]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
