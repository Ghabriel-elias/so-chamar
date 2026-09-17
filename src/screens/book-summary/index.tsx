"use client";

import { useLocale, useTranslations } from "next-intl";

import { ActionBar } from "@/components/ui/action-bar";
import { Amount } from "@/components/ui/amount";
import { Button, ButtonLink } from "@/components/ui/button";
import { DataList, DataRow } from "@/components/ui/data-list";
import { Header } from "@/components/ui/header";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { StepTransition } from "@/components/ui/step-transition";
import { Steps } from "@/components/ui/steps";
import { BOOKING_STEPS } from "@/utils/booking/draft";
import { HOURS_PROVIDER_NO_SHOW_REFUND } from "@/utils/booking/rules";
import { dayAndTime } from "@/utils/format/date";
import { formatPhone } from "@/utils/format/phone";
import type { Locale } from "@/i18n/config";

import { useBookSummary } from "./useBookSummary";

export function BookingSummary({ slug }: { slug: string }) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const screen = useBookSummary(slug);
  const {
    draft,
    arrival,
    direct,
    mustPayInFull,

    amounts,
    startsAt,
    refundsAll,
    deadline,
    saving,
    failure,
  } = screen;

  if (screen.loading)
    return <ListSkeleton rows={2} lead="none" className="mt-6" />;

  const page = screen.page;
  const service = screen.service;

  if (!screen.ready || !page || !service) {
    return (
      <>
        <Header title={t("summary")} backTo={`/${slug}`} />
        <Notice kind="attention" title={t("draftGone")}>
          {t("draftGoneBody")}
        </Notice>
      </>
    );
  }

  return (
    <>
      <StepTransition direction={arrival.direction}>
        <Header
          title={direct ? t("summaryDirect") : t("summary")}
          backTo={`/${slug}/agendar/dados`}
          rowTitle={service.name}
          steps={
            <Steps current={3} total={BOOKING_STEPS} from={arrival.from} />
          }
        />
      </StepTransition>
      <StepTransition direction={arrival.direction} order={1}>
      {failure ? (
        <Notice kind="error" title={t("couldNotBook")} live className="mb-6">
          {failure}{" "}
          <ButtonLink
            look="plain"
            href={`/${slug}/agendar/horario?servico=${service.id}`}
            className="px-0"
          >
            {t("pickAnotherTime")}
          </ButtonLink>
        </Notice>
      ) : null}

      {mustPayInFull ? (
        <Notice kind="attention" title={t("payInFullTitle")} className="mb-6">
          {t("payInFullBody")}
        </Notice>
      ) : null}

      <Sheet>
        <SheetHeader title={dayAndTime(startsAt, locale)} />
        <SheetBody>
          <DataList>
            <DataRow label={t("what")}>{service.name}</DataRow>
            <DataRow label={t("withWho")}>{page.provider.name}</DataRow>
            <DataRow label={t("where")}>{draft.address}</DataRow>
            <DataRow label={t("whoYouAre")}>
              {draft.customerName}
              <span className="tabular block text-note text-gray">
                {formatPhone(draft.customerPhone ?? "")}
              </span>
            </DataRow>
          </DataList>

          {draft.problemDescription ? (
            <>
              <p className="mt-4 text-note text-gray">{t("whatYouTold")}</p>
              <p className="mt-1 text-body text-ink">
                {draft.problemDescription}
              </p>
            </>
          ) : null}
        </SheetBody>
      </Sheet>

      <Sheet className="mt-4">
        <SheetBody>
          {direct ? (
            <DataList>
              <DataRow label={t("priceFrom")} highlight>
                <Amount cents={amounts.total} size="lead" />
              </DataRow>
              <DataRow label={t("payDirect")}>
                {t("payDirectValue", { provider: page.provider.name })}
              </DataRow>
            </DataList>
          ) : (
            <>
              <DataList>
                <DataRow label={t("priceFrom")}>
                  <Amount cents={amounts.total} />
                </DataRow>
                <DataRow label={t("payNow")} highlight>
                  <Amount
                    cents={amounts.deposit}
                    size="lead"
                    className="text-green"
                  />
                </DataRow>
                <DataRow label={t("finalPrice")}>
                  <span className="text-note text-gray">
                    {t("finalPriceValue")}
                  </span>
                </DataRow>
              </DataList>

              <p className="mt-4 text-note text-gray">
                {t("priceLaterNote", { amount: amounts.total / 100 })}
              </p>
            </>
          )}
        </SheetBody>
      </Sheet>

      <section className="mt-8 pb-4">
        <h2 className="text-lead">{t("rules")}</h2>

        {direct ? (
          <ul className="mt-3 flex flex-col gap-3 text-body text-ink">
            <li className="rule pb-3">
              {t("rulePayDirect", { provider: page.provider.name })}
            </li>
            <li className="rule pb-3">{t("ruleCancelDirect")}</li>
            <li>{t("ruleReminder")}</li>
          </ul>
        ) : (
          <ul className="mt-3 flex flex-col gap-3 text-body text-ink">
            <li className="rule pb-3">
              {refundsAll
                ? t("ruleCancelEarly", {
                    deadline: dayAndTime(deadline, locale),
                    amount: amounts.deposit / 100,
                  })
                : t("ruleCancelLate", { amount: amounts.deposit / 100 })}
            </li>
            <li className="rule pb-3">
              {t("ruleProviderNoShow", {
                hours: HOURS_PROVIDER_NO_SHOW_REFUND,
              })}
            </li>
            <li className="rule pb-3">
              {t("ruleBalance")}
            </li>
            <li>{t("ruleRelease")}</li>
          </ul>
        )}
      </section>
      </StepTransition>

      <ActionBar
        note={direct ? t("confirmDirectNote") : undefined}
        enter={arrival.direction === null}
      >
        <Button look="primary" fullWidth loading={saving} onClick={screen.confirm}>
          {direct
            ? t("confirmDirect")
            : t("confirmAndPay", { amount: amounts.deposit / 100 })}
        </Button>
      </ActionBar>
    </>
  );
}
