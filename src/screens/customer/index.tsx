"use client";

import {
  Ban,
  ShieldAlert,
  Star,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { OpenInMaps } from "@/components/booking/open-in-maps";
import { DebugPanel } from "@/components/debug/debug-panel";
import { Amount } from "@/components/ui/amount";
import { Button, ButtonLink } from "@/components/ui/button";
import { DataList, DataRow } from "@/components/ui/data-list";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { StatusChip } from "@/components/ui/status-chip";
import { api } from "@/utils/api";
import { chargesThroughApp } from "@/utils/booking/rules";
import { dayAndTime, time } from "@/utils/format/date";
import type { Locale } from "@/i18n/config";

import { useCustomer } from "./useCustomer";

export function CustomerHub({ token }: { token: string }) {
  const t = useTranslations("customerLink");
  const locale = useLocale() as Locale;
  const screen = useCustomer(token);
  const {
    confirming,
    setConfirming,
    working,
    failure,
    run,
    startsAt,
    paid,
    refunded,
    depositMethod,
    stillDue,
    refundsAll,
    deadline,
    priced,
    direct,
    noDeposit,
  } = screen;

  if (screen.loading)
    return <ListSkeleton rows={2} lead="none" className="mt-6" />;

  if (screen.error || !screen.view) {
    return (
      <Notice kind="attention" title={t("linkGone")} live className="mt-6">
        {screen.error ?? t("linkGoneBody")}
      </Notice>
    );
  }

  const { booking, service, provider, actions } = screen.view;

  return (
    <>
      {booking.state === "confirmed" ? (
        <Notice kind="ok" title={t("confirmedTitle")} className="mt-6">
          {t("confirmedBody", { provider: provider.name })}
        </Notice>
      ) : null}

      {booking.state === "pending_payment" && booking.paymentDueAt ? (
        <Notice
          kind="attention"
          title={t("pendingTitle")}
          className="on-attention mt-6"
        >
          {t("pendingBody", {
            time: time(new Date(booking.paymentDueAt), locale),
          })}
        </Notice>
      ) : null}

      {booking.state === "payment_expired" ? (
        <Notice
          kind="attention"
          title={t("expiredTitle")}
          className="on-attention mt-6"
        >
          {t("expiredBody")}
          <ButtonLink
            look="primary"
            fullWidth
            href={`/${provider.slug}`}
            className="mt-3"
          >
            {t("bookAgain")}
          </ButtonLink>
        </Notice>
      ) : null}

      <header className="mt-6 flex flex-col gap-2">
        <StatusChip
          state={booking.state}
          viewpoint="customer"
          announce
          className="w-fit"
        />
        <h1 className="text-title first-letter:uppercase">
          {dayAndTime(startsAt, locale)}
        </h1>
        <p className="text-body text-gray">
          {t("withService", { service: service.name, provider: provider.name })}
        </p>
      </header>

      {failure ? (
        <Notice kind="error" live className="mt-4">
          {failure}
        </Notice>
      ) : null}

      <Sheet className="mt-6">
        <SheetHeader title={t("where")} />
        <SheetBody className="flex flex-col gap-3">
          <p className="text-body text-ink">{booking.address}</p>
          <OpenInMaps address={booking.address}>{t("openInMaps")}</OpenInMaps>
        </SheetBody>
      </Sheet>

      <Sheet className="mt-4">
        <SheetBody>
          <DataList>
            <DataRow label={priced ? t("total") : t("priceFrom")}>
              <Amount cents={booking.totalAmount} />
            </DataRow>
            {direct ? (
              <DataRow label={t("payDirect")}>
                {t("payDirectValue", { provider: provider.name })}
              </DataRow>
            ) : null}
            {paid > 0 ? (
              <DataRow label={t("alreadyPaid")}>
                <Amount cents={paid} className="text-green" />
                {depositMethod ? (
                  <span className="block text-note text-gray">
                    {t("paidWith", { method: depositMethod })}
                  </span>
                ) : null}
              </DataRow>
            ) : null}
            {stillDue > 0 ? (
              <DataRow label={t("stillDue")} highlight>
                <Amount cents={stillDue} size="lead" />
              </DataRow>
            ) : null}
            {refunded > 0 ? (
              <DataRow label={t("refunded")}>
                <Amount cents={refunded} />
              </DataRow>
            ) : null}
          </DataList>

          {priced || direct ? null : (
            <p className="mt-4 text-note text-gray">{t("priceFromNote")}</p>
          )}
        </SheetBody>
      </Sheet>

      <section className="mt-8 flex flex-col gap-2">
        {actions.includes("pay_deposit") ? (
          <ButtonLink
            look="primary"
            fullWidth
            icon={Wallet}
            href={`/a/${token}/pagar`}
          >
            {t("payDeposit")}
          </ButtonLink>
        ) : null}

        {actions.includes("pay_balance") ? (
          <ButtonLink
            look="primary"
            fullWidth
            icon={Wallet}
            href={`/a/${token}/pagar`}
          >
            {t("payBalance")}
          </ButtonLink>
        ) : null}

        {actions.includes("review") ? (
          <ButtonLink
            look="primary"
            fullWidth
            icon={Star}
            href={`/a/${token}/avaliar`}
          >
            {t("leaveReview")}
          </ButtonLink>
        ) : null}

        {actions.includes("dispute") ? (
          <Button
            look="secondary"
            fullWidth
            icon={ShieldAlert}
            onClick={() => setConfirming("dispute")}
          >
            {t("dispute")}
          </Button>
        ) : null}

        {actions.includes("cancel_by_customer") ? (
          <Button
            look="destructive"
            fullWidth
            icon={Ban}
            onClick={() => setConfirming("cancel")}
          >
            {t("cancel")}
          </Button>
        ) : null}
      </section>

      <section className="mt-8 pb-16">
        <h2 className="text-lead">{t("rules")}</h2>
        <ul className="mt-3 flex flex-col gap-3 text-body text-ink">
          {actions.includes("cancel_by_customer") ? (
            <li className="rule pb-3 last:pb-0">
              {noDeposit
                ? t("ruleCancelDirect")
                : refundsAll
                  ? t("ruleCancelEarly", {
                      deadline: dayAndTime(deadline, locale),
                      amount: booking.depositAmount / 100,
                    })
                  : t("ruleCancelLate", {
                      amount: booking.depositAmount / 100,
                    })}
            </li>
          ) : null}
          {direct ? (
            <li>{t("rulePayDirect", { provider: provider.name })}</li>
          ) : chargesThroughApp(booking.depositMode) ? (
            <li>{t("ruleRelease")}</li>
          ) : null}
        </ul>
      </section>

      <ConfirmDialog
        open={confirming === "cancel"}
        title={t("cancelConfirm", {
          provider: provider.name,
          when: dayAndTime(startsAt, locale),
        })}
        consequence={
          noDeposit
            ? t("cancelConsequenceDirect")
            : refundsAll
              ? t("cancelConsequenceEarly", {
                  amount: booking.depositAmount / 100,
                })
              : t("cancelConsequenceLate", {
                  amount: booking.depositAmount / 100,
                })
        }
        confirmLabel={t("cancelYes")}
        loading={working}
        onCancel={() => setConfirming(null)}
        onConfirm={() => run(() => api.cancelByCustomer(token))}
      />

      <ConfirmDialog
        open={confirming === "dispute"}
        title={t("disputeConfirm")}
        consequence={t("disputeConsequence", {
          amount: (paid || booking.totalAmount) / 100,
        })}
        confirmLabel={t("disputeYes")}
        loading={working}
        onCancel={() => setConfirming(null)}
        onConfirm={() => run(() => api.dispute(token, "customer_dispute"))}
      />

      <DebugPanel onChange={screen.reload} />
    </>
  );
}
