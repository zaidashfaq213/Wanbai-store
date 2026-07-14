"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { submitReview, type ContentState } from "@/lib/actions/content";
import { cn } from "@/lib/utils";
import { StarIcon } from "@/components/ui/icons";

export function ReviewForm({
  locale,
  dict,
  productId,
  productSlug,
}: {
  locale: Locale;
  dict: Dictionary["reviews"];
  productId: string;
  productSlug: string;
}) {
  const [rating, setRating] = useState(5);
  const [state, action, pending] = useActionState<ContentState, FormData>(
    submitReview,
    { ok: false },
  );

  if (state.ok && state.code === "review_saved") {
    return (
      <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm font-semibold text-emerald-500">
        {dict.submitted}
      </p>
    );
  }

  const errorMsg =
    !state.ok && state.code
      ? state.code === "not_purchased"
        ? dict.mustPurchase
        : state.code === "already_reviewed"
          ? dict.alreadyReviewed
          : dict.error
      : null;

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="rating" value={rating} />

      <h3 className="font-extrabold">{dict.write}</h3>

      {errorMsg && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
          {errorMsg}
        </p>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold text-muted">{dict.rating}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n}`}
              className="transition-transform hover:scale-110"
            >
              <StarIcon
                className={cn(
                  "size-7",
                  n <= rating ? "fill-amber-400 text-amber-400" : "text-muted",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">{dict.comment}</span>
        <textarea
          name="comment"
          required
          minLength={4}
          maxLength={600}
          rows={3}
          placeholder={dict.placeholder}
          className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl brand-gradient px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {dict.submit}
      </button>
    </form>
  );
}
