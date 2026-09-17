"use client";

import { ArrowRight, CalendarPlus, CircleAlert, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { AddressFields } from "@/components/booking/address-fields";
import { SlotPicker } from "@/components/customer/slot-picker";
import { ActionBar } from "@/components/ui/action-bar";
import { AddFab } from "@/components/ui/add-fab";
import { Amount } from "@/components/ui/amount";
import { Button, ButtonLink } from "@/components/ui/button";
import { useDurationText } from "@/components/ui/duration";
import { ChoiceField, TextAreaField, TextField } from "@/components/ui/field";
import { FormProblems } from "@/components/ui/form-problems";
import { Header } from "@/components/ui/header";
import { FormSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { StepTransition } from "@/components/ui/step-transition";
import { Steps } from "@/components/ui/steps";
import { withBack } from "@/utils/panel/back";
import { formatPhone } from "@/utils/format/phone";

import { useNewBooking } from "./useNewBooking";

const TOTAL = 5;

export function NewBooking() {
  const t = useTranslations("panel.new");
  const tUi = useTranslations("ui");
  const tBooking = useTranslations("booking");
  const tCommon = useTranslations("common");
  const tCatalog = useTranslations("catalog");
  const durationText = useDurationText();

  const screen = useNewBooking();
  const {
    step,
    direction,
    go,
    forward,
    services,
    service,
    provider,
    serviceId,
    setServiceId,
    startsAt,
    setStartsAt,
    collectsDeposit,
    mode,
    setMode,
    percent,
    amounts,
    address,
    values,
    set,
    saving,
    failure,
    errorFor,
  } = screen;

  if (screen.loading) return <FormSkeleton fields={3} className="mt-6" />;

  return (
    <>
      <Header title={t("title")} backTo="/painel" />

      <Steps current={step} total={TOTAL} from={0} className="mb-6" />

      {step === 1 ? (
        <StepTransition direction={direction}>
          <Sheet>
            <SheetHeader title={t("whichService")} />
            <SheetBody>
              <ButtonLink
                look="secondary"
                fullWidth
                icon={Plus}
                href={withBack("/painel/ajustes/adicionar", "/painel/novo")}
                className="mb-4 hidden! sm:inline-flex!"
              >
                {tCatalog("add")}
              </ButtonLink>

              <div id="new-service" className="scroll-mt-24">
                <ChoiceField
                  name="service"
                  label={t("whichService")}
                  labelHidden
                  error={errorFor("service")}
                  value={serviceId}
                  onChoose={(value) => {
                    setServiceId(value);
                    setStartsAt(undefined);
                  }}
                  onClear={() => {
                    setServiceId(null);
                    setStartsAt(undefined);
                  }}
                  options={services.map((item) => ({
                    value: item.id,
                    label: item.name,
                    detail: t("serviceDetail", {
                      price: item.priceFrom / 100,
                      duration: durationText(item.durationMinutes),
                    }),
                  }))}
                />
              </div>

            </SheetBody>
          </Sheet>

          <AddFab
            aboveBar
            id="new-booking-add"
            label={tCatalog("add")}
            href={withBack("/painel/ajustes/adicionar", "/painel/novo")}
          />
        </StepTransition>
      ) : null}

      {step === 2 && service && provider ? (
        <StepTransition direction={direction}>
          <section id="new-slots" className="scroll-mt-24">
            <h2 className="text-lead">{t("whenIsIt")}</h2>
            <p className="mb-4 mt-1 text-body text-gray">{t("whenIsItNote")}</p>

            {errorFor("slot") ? (
              <p
                role="alert"
                className="mb-4 flex items-start gap-2 text-note text-red"
              >
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <span>{errorFor("slot")}</span>
              </p>
            ) : null}

            <SlotPicker
              providerId={provider.id}
              serviceId={service.id}
              selected={startsAt}
              onPick={setStartsAt}
            />
          </section>
        </StepTransition>
      ) : null}

      {step === 3 ? (
        <StepTransition direction={direction}>
          <Sheet>
            <SheetHeader title={t("whoIsIt")} />
            <SheetBody className="flex flex-col gap-5">
              <TextField
                id="new-name"
                label={t("nameLabel")}
                value={values.customerName}
                onChange={(event) => set("customerName", event.target.value)}
                error={errorFor("customerName")}
              />
              <TextField
                id="new-phone"
                label={t("phoneLabel")}
                hint={t("phoneHint")}
                inputMode="numeric"
                value={formatPhone(values.customerPhone)}
                onChange={(event) => set("customerPhone", event.target.value)}
                error={errorFor("customerPhone")}
              />
              <TextAreaField
                optional
                id="new-problem"
                label={t("problemLabel")}
                rows={3}
                value={values.problemDescription}
                onChange={(event) =>
                  set("problemDescription", event.target.value)
                }
                error={errorFor("problemDescription")}
              />
            </SheetBody>
          </Sheet>
        </StepTransition>
      ) : null}

      {step === 4 ? (
        <StepTransition direction={direction}>
          <Sheet>
            <SheetHeader title={tBooking("addressTitle")} />
            <SheetBody>
              <AddressFields form={address} errorFor={errorFor} />
            </SheetBody>
          </Sheet>
        </StepTransition>
      ) : null}

      {step === 5 && service ? (
        <StepTransition direction={direction}>
          <Sheet>
            <SheetHeader
              title={collectsDeposit ? t("depositTitle") : t("paymentTitle")}
            />
            <SheetBody className="flex flex-col gap-5">
              <ChoiceField
                name="deposit-mode"
                label={collectsDeposit ? t("depositTitle") : t("paymentTitle")}
                labelHidden
                hint={collectsDeposit ? t("depositHint") : t("paymentHintOff")}
                value={mode}
                onChoose={setMode}
                options={
                  collectsDeposit
                    ? [
                        {
                          value: "with_deposit",
                          label: t("withDeposit"),
                          detail: amounts
                            ? t("withDepositNote", {
                                amount: amounts.deposit / 100,
                              })
                            : undefined,
                        },
                        {
                          value: "no_deposit",
                          label: t("noDeposit"),
                        },
                        {
                          value: "paid_outside",
                          label: t("paidOutside"),
                        },
                      ]
                    : [
                        {
                          value: "pay_direct",
                          label: t("payDirect"),
                          detail: t("payDirectNote"),
                        },
                        {
                          value: "paid_outside",
                          label: t("paidOutside"),
                        },
                      ]
                }
              />

              {mode === "with_deposit" ? (
                <p className="text-note text-gray">
                  {t("percentNote", { value: percent / 100 })}
                </p>
              ) : null}

              {amounts && mode === "with_deposit" ? (
                <p className="flex flex-wrap items-baseline gap-2 text-body">
                  <span className="text-gray">{t("summaryNow")}</span>
                  <Amount
                    cents={amounts.deposit}
                    size="lead"
                    className="text-green"
                  />
                  <span className="text-gray">{t("summaryLater")}</span>
                  <Amount cents={amounts.balance} className="text-ink" />
                </p>
              ) : null}
            </SheetBody>
          </Sheet>
        </StepTransition>
      ) : null}

      {failure ? (
        <Notice kind="error" live className="mt-6">
          {failure}
        </Notice>
      ) : null}

      <ActionBar
        aboveNav
        enter={direction === null}
        alert={<FormProblems problems={screen.problemsOf(step)} />}
      >
        {step === 1 ? (
          <Button look="primary" fullWidth icon={ArrowRight} onClick={forward}>
            {tCommon("continue")}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              look="secondary"
              className="min-h-touch-lg flex-1"
              onClick={() => go(step - 1)}
            >
              {tUi("back")}
            </Button>
            {step < TOTAL ? (
              <Button
                look="primary"
                className="flex-2"
                icon={ArrowRight}
                onClick={forward}
              >
                {tCommon("continue")}
              </Button>
            ) : (
              <Button
                look="primary"
                className="flex-2"
                icon={CalendarPlus}
                loading={saving}
                onClick={screen.submit}
              >
                {t("create")}
              </Button>
            )}
          </div>
        )}
      </ActionBar>
    </>
  );
}
