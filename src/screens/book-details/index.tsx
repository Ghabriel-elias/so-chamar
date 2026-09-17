"use client";

import { useLocale, useTranslations } from "next-intl";

import { AddressFields } from "@/components/booking/address-fields";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { FormProblems } from "@/components/ui/form-problems";
import { Header } from "@/components/ui/header";
import { Notice } from "@/components/ui/notice";
import { StepTransition } from "@/components/ui/step-transition";
import { Steps } from "@/components/ui/steps";
import { BOOKING_STEPS } from "@/utils/booking/draft";
import { formatPhone } from "@/utils/format/phone";
import type { Locale } from "@/i18n/config";

import { useBookDetails } from "./useBookDetails";
import { time } from "@/utils/format/date";

export function CustomerDetails({ slug }: { slug: string }) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const screen = useBookDetails(slug);
  const {
    draft,
    arrival,
    address,
    values,
    set,
    problem,
    setProblem,
    pending,
    resend,
    errorFor,
  } = screen;

  return (
    <form onSubmit={screen.submit} noValidate>
      <StepTransition direction={arrival.direction}>
        <Header
          backTo={screen.backToTime}
          rowTitle={draft.serviceName}
          steps={
            <Steps current={2} total={BOOKING_STEPS} from={arrival.from} />
          }
        />
      </StepTransition>

      <StepTransition
        direction={arrival.direction}
        order={1}
        className="flex flex-col gap-8"
      >
        <section className="flex flex-col gap-6">
          <h1 className="text-lead">{t("yourDetails")}</h1>

          <TextField
            id="details-name"
            label={t("nameLabel")}
            hint={t("nameHint")}
            autoComplete="name"
            value={values.customerName}
            onChange={(event) => set("customerName", event.target.value)}
            error={errorFor("customerName")}
          />

          <TextField
            id="details-phone"
            label={t("phoneLabel")}
            hint={t("phoneHint")}
            inputMode="numeric"
            autoComplete="tel"
            value={formatPhone(values.customerPhone)}
            onChange={(event) => set("customerPhone", event.target.value)}
            error={errorFor("customerPhone")}
          />

          {pending ? (
            <Notice
              kind="attention"
              title={t("pendingPhoneTitle")}
              live
              className="on-attention"
            >
              <p>
                {t("pendingPhoneBody", {
                  time: time(new Date(pending.paymentDueAt), locale),
                })}
              </p>
              {resend === "sent" ? (
                <p role="status" className="mt-2 font-medium">
                  {t("pendingPhoneSent", {
                    phone: formatPhone(values.customerPhone),
                  })}
                </p>
              ) : (
                <Button
                  look="secondary"
                  fullWidth
                  loading={resend === "sending"}
                  onClick={screen.sendLink}
                  className="mt-3"
                >
                  {t("pendingPhoneResend")}
                </Button>
              )}
              <p className="mt-2 text-note">{t("pendingPhoneOr")}</p>
            </Notice>
          ) : null}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lead">{t("problemLabel")}</h2>
          <TextAreaField
            id="problem-description"
            label={t("problemLabel")}
            labelHidden
            hint={t("problemHint")}
            rows={4}
            optional
            maxLength={500}
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            error={errorFor("problemDescription")}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lead">{t("addressTitle")}</h2>
          <AddressFields form={address} errorFor={errorFor} />
        </section>
      </StepTransition>

      <ActionBar
        enter={arrival.direction === null}
        alert={<FormProblems problems={screen.problems} />}
      >
        <Button
          look="primary"
          type="submit"
          fullWidth
          loading={address.searching}
        >
          {t("continue")}
        </Button>
      </ActionBar>
    </form>
  );
}
