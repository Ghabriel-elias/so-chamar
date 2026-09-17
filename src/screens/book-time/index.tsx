"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { SlotPicker } from "@/components/customer/slot-picker";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { FormProblems } from "@/components/ui/form-problems";
import { Header } from "@/components/ui/header";
import { Notice } from "@/components/ui/notice";
import { ChipsSkeleton } from "@/components/ui/skeleton";
import { StepTransition } from "@/components/ui/step-transition";
import { Steps } from "@/components/ui/steps";
import { BOOKING_STEPS } from "@/utils/booking/draft";

import { useBookTime } from "./useBookTime";

export function PickTime({ slug }: { slug: string }) {
  const t = useTranslations("booking");
  const tError = useTranslations("errors");
  const tUi = useTranslations("ui");
  const screen = useBookTime(slug);

  if (screen.loading) return <ChipsSkeleton count={10} className="mt-6" />;

  if (!screen.page || !screen.service) {
    return (
      <Notice kind="attention" className="mt-6">
        {t("serviceGone")}
      </Notice>
    );
  }

  return (
    <>
      <StepTransition direction={screen.arrival.direction}>
        <Header
          title={t("pickTime")}
          rowTitle={screen.service.name}
          backTo={`/${slug}`}
          steps={
            <Steps
              current={1}
              total={BOOKING_STEPS}
              from={screen.arrival.from ?? 0}
            />
          }
          backLabel={tUi("exit")}
        />
      </StepTransition>

      <StepTransition direction={screen.arrival.direction} order={1}>
        {screen.missing ? (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 text-note text-red"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <span>{tError("slotRequired")}</span>
          </p>
        ) : null}

        <div id="booking-slots" className="scroll-mt-24">
          <SlotPicker
            providerId={screen.page.provider.id}
            serviceId={screen.serviceId}
            selected={screen.picked}
            onPick={screen.setPicked}
          />
        </div>
      </StepTransition>

      <ActionBar
        enter={screen.arrival.direction === null}
        alert={<FormProblems problems={screen.problems} />}
      >
        <Button look="primary" fullWidth onClick={screen.goOn}>
          {t("continue")}
        </Button>
      </ActionBar>
    </>
  );
}
