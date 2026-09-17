import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/utils/cn";

export function Stars({
  rating,
  reviewCount,
  onReviewsClick,
  className,
}: {
  rating: number;
  reviewCount?: number;
  onReviewsClick?: () => void;
  className?: string;
}) {
  const t = useTranslations("ui");
  const locale = useLocale();

  const content = (
    <>
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.min(1, Math.max(0, rating - index));

          return (
            <span key={index} className="relative inline-flex size-5">
              <Star className="size-5 fill-surface text-border" />
              {fill > 0 ? (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className="size-5 max-w-none fill-yellow text-yellow-dark" />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      <span className="tabular text-body text-ink">
        {rating.toLocaleString(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
      </span>
      <span className="sr-only">{t("stars", { rating })}</span>
      {reviewCount !== undefined ? (
        <span
          className={cn(
            "text-note",
            onReviewsClick
              ? "font-medium text-blue underline underline-offset-4"
              : "text-gray",
          )}
        >
          {t("reviews", { total: reviewCount })}
        </span>
      ) : null}
    </>
  );

  if (onReviewsClick) {
    return (
      <button
        type="button"
        onClick={onReviewsClick}
        className={cn(
          "touchable -mx-2 flex min-h-touch items-center gap-2 self-start rounded-card px-2 hover:bg-surface active:scale-[0.98]",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return <p className={cn("flex items-center gap-2", className)}>{content}</p>;
}
