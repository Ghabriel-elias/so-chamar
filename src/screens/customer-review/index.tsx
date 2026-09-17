"use client";

import { CircleAlert, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { FormProblems } from "@/components/ui/form-problems";
import { Header } from "@/components/ui/header";
import { Notice } from "@/components/ui/notice";
import { ListSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

import { useCustomerAvaliacao } from "./useCustomerReview";

export function LeaveReview({ token }: { token: string }) {
  const t = useTranslations("review");
  const tError = useTranslations("errors");
  const screen = useCustomerAvaliacao(token);

  if (screen.loading) return <ListSkeleton rows={2} lead="none" className="mt-6" />;

  if (!screen.booking) {
    return (
      <Notice kind="attention" className="mt-6">
        {t("linkGone")}
      </Notice>
    );
  }

  if (!screen.canReview) {
    return (
      <>
        <Header title={t("title")} backTo={`/a/${token}`} />
        <Notice kind="info">{t("notNow")}</Notice>
      </>
    );
  }

  return (
    <>
      <Header
        title={t("title")}
        subtitle={t("subtitle", { provider: screen.booking.provider.name })}
        backTo={`/a/${token}`}
      />

      <fieldset id="review-rating" className="mt-4 scroll-mt-24">
        <legend className="text-body font-medium text-ink">
          {t("howWasIt")}
        </legend>

        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= screen.rating;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                aria-label={t("ratingOption", { value })}
                onClick={() => screen.setRating(value)}
                className={cn(
                  "flex min-h-touch-lg flex-1 flex-col items-center justify-center gap-1 rounded-card border",
                  active
                    ? "border-action bg-blue-soft"
                    : screen.missing
                      ? "border-red bg-white"
                      : "border-border bg-white",
                )}
              >
                <Star
                  aria-hidden="true"
                  className={cn(
                    "size-6",
                    active ? "fill-yellow text-yellow-dark" : "text-border",
                  )}
                />
                <span className="tabular text-note text-ink">{value}</span>
              </button>
            );
          })}
        </div>

        {screen.rating > 0 ? (
          <p role="status" className="mt-3 text-body text-ink">
            {t(`meaning${screen.rating}` as "meaning1")}
          </p>
        ) : null}

        {screen.missing ? (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 text-note text-red"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <span>{tError("ratingRequired")}</span>
          </p>
        ) : null}
      </fieldset>

      <div className="mt-8">
        <TextAreaField
          label={t("commentLabel")}
          hint={t("commentHint")}
          optional
          rows={4}
          value={screen.comment}
          onChange={(event) => screen.setComment(event.target.value)}
        />
      </div>

      {screen.failure ? (
        <Notice kind="error" live className="mt-6">
          {screen.failure}
        </Notice>
      ) : null}

      <ActionBar alert={<FormProblems problems={screen.problems} />}>
        <Button look="primary" fullWidth loading={screen.saving} onClick={screen.send}>
          {t("send")}
        </Button>
      </ActionBar>
    </>
  );
}
