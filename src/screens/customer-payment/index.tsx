"use client";

import { useLocale, useTranslations } from "next-intl";

import { PaymentMethodForm } from "@/components/payment/payment-method-form";
import { ActionBar } from "@/components/ui/action-bar";
import { Amount } from "@/components/ui/amount";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceField } from "@/components/ui/field";
import { FormProblems } from "@/components/ui/form-problems";
import { Header } from "@/components/ui/header";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { StepTransition } from "@/components/ui/step-transition";
import { Steps } from "@/components/ui/steps";
import { BOOKING_STEPS } from "@/utils/booking/draft";
import { dayAndTime, time } from "@/utils/format/date";
import { now } from "@/utils/time/clock";
import type { Locale } from "@/i18n/config";

import { useCustomerPagamento } from "./useCustomerPayment";

export function PaymentScreen({ token }: { token: string }) {
  const t = useTranslations("payment");
  const locale = useLocale() as Locale;
  const screen = useCustomerPagamento(token);
  const {
    arrival,
    method,
    card,
    setCard,
    showedUp,
    setShowedUp,
    paying,
    failure,
    payingDeposit,
    payingBalance,
    byCard,
    amount,
    code,
  } = screen;

  if (screen.loading)
    return <ListSkeleton rows={2} lead="none" className="mt-6" />;

  if (!screen.view) {
    return (
      <Notice kind="attention" className="mt-6">
        {t("linkGone")}
      </Notice>
    );
  }

  const { booking, service, provider } = screen.view;
  if (booking.state === "payment_expired") {
    return (
      <>
        <Header
          title={t("titleDeposit")}
          backTo={`/${provider.slug}`}
        />
        <Notice kind="attention" title={t("expiredTitle")} live>
          {t("expiredBody")}
        </Notice>
        <ButtonLink
          look="primary"
          fullWidth
          href={`/${provider.slug}`}
          className="mt-6"
        >
          {t("bookAgain")}
        </ButtonLink>
      </>
    );
  }

  if (!payingDeposit && !payingBalance) {
    return (
      <>
        <Header title={t("title")} backTo={`/a/${token}`} />
        <Notice kind="info">{t("nothingToPay")}</Notice>
      </>
    );
  }

  const direction = payingDeposit ? arrival.direction : null;

  return (
    <>
      <StepTransition direction={direction}>
        <Header
          title={payingDeposit ? t("titleDeposit") : t("titleBalance")}
          subtitle={
            payingDeposit
              ? `${service.name} · ${dayAndTime(new Date(booking.startsAt), locale)}`
              : provider.name
          }
          backTo={`/a/${token}`}
          rowTitle={service.name}
          steps={
            payingDeposit ? (
              <Steps
                current={BOOKING_STEPS}
                total={BOOKING_STEPS}
                from={arrival.from}
              />
            ) : null
          }
        />
      </StepTransition>

      <StepTransition direction={direction} order={1}>
      <p className="flex flex-col items-center gap-1">
        <span className="text-note text-gray">{t("youPay")}</span>
        <Amount cents={amount} size="display" className="text-green" />
      </p>

      {payingDeposit && booking.paymentDueAt ? (
        <p className="mt-3 text-center text-body text-ink">
          {t("dueUntil", {
            time: time(new Date(booking.paymentDueAt), locale),
          })}
          <span className="block text-note text-gray">
            {t("minutesLeft", {
              minutes: Math.max(
                1,
                Math.ceil(
                  (new Date(booking.paymentDueAt).getTime() - now().getTime()) /
                    60_000,
                ),
              ),
            })}
          </span>
        </p>
      ) : null}

      <PaymentMethodForm
        className="mt-8"
        method={payingDeposit ? method : "pix"}
        onMethodChange={screen.chooseMethod}
        card={card}
        onCardChange={setCard}
        allowCard={payingDeposit}
        idPrefix="deposit-card"
        errors={screen.cardErrors}
        pixSeed={token}
        pixCode={code}
      />

      {payingBalance ? (
        <section id="payment-showed-up" className="mt-10 scroll-mt-24">
          <ChoiceField
            name="showed-up"
            label={t("showUpQuestion", { provider: provider.name })}
            hint={t("showUpHint")}
            value={showedUp}
            onChoose={setShowedUp}
            error={screen.errorFor("showUp")}
            options={[
              { value: "yes", label: t("showUpYes"), detail: t("showUpYesNote") },
              { value: "no", label: t("showUpNo"), detail: t("showUpNoNote") },
            ]}
          />
        </section>
      ) : null}

      {failure ? (
        <Notice kind="error" live className="mt-6">
          {failure}
        </Notice>
      ) : null}
      </StepTransition>

      <ActionBar
        note={t("simulateNote")}
        alert={<FormProblems problems={screen.problems} />}
        enter={direction === null}
      >
        <Button look="primary" fullWidth loading={paying} onClick={screen.pay}>
          {payingDeposit && byCard
            ? t("payCard", { amount: amount / 100 })
            : t("simulate")}
        </Button>
      </ActionBar>
    </>
  );
}
