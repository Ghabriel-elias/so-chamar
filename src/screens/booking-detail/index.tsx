"use client";

import {
  Ban,
  CheckCheck,
  HandCoins,
  MessageCircle,
  UserX,
  Wrench,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { OpenInMaps } from "@/components/booking/open-in-maps";
import { ActionBar } from "@/components/ui/action-bar";
import { Amount } from "@/components/ui/amount";
import { Button, ExternalButton } from "@/components/ui/button";
import { DataList, DataRow } from "@/components/ui/data-list";
import { ConfirmDialog, FormDialog } from "@/components/ui/dialog";
import { Header } from "@/components/ui/header";
import { MoneyField } from "@/components/ui/money-field";
import { ListSkeleton, SkeletonLines } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { StatusChip } from "@/components/ui/status-chip";
import { api, type BookingDetail as Detail } from "@/utils/api";
import { cn } from "@/utils/cn";
import { STATE_LOOK } from "@/utils/booking/states";
import { dayAndTime, time } from "@/utils/format/date";
import { formatPhone } from "@/utils/format/phone";

import type { Locale } from "@/i18n/config";
import type { Cents, Payment } from "@/types/booking";

import { useBookingDetail } from "./useBookingDetail";

export function BookingDetailView({ id }: { id: string }) {
  const t = useTranslations("panel.detail");
  const tCard = useTranslations("card");
  const locale = useLocale() as Locale;

  const screen = useBookingDetail(id);
  const {
    confirming,
    setConfirming,
    closing,
    setClosing,
    working,
    failure,
    run,
    heldAmount,
    settlesOutside,
    priceClosed,
    balanceIn,
    direct,
    noDeposit,
  } = screen;

  if (screen.loading) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <SkeletonLines lines={2} />
        <ListSkeleton rows={2} lead="none" />
      </div>
    );
  }

  if (screen.error || !screen.detail) {
    return (
      <>
        <Header title={t("title")} backTo={screen.back} />
        <Notice kind="attention" live>
          {screen.error ?? t("notFound")}
        </Notice>
      </>
    );
  }

  const { booking, service, payments, customer, review, actions } =
    screen.detail;
  const mainAction = actions.includes("start")
    ? {
        trigger: "start" as const,
        label: t("start"),
        icon: Wrench,
        note: t("startNote"),
      }
    : actions.includes("finish")
      ? {
          trigger: "finish" as const,
          label: t("finish"),
          icon: CheckCheck,
          note: settlesOutside ? t("finishNoteNoCharge") : undefined,
        }
      : settlesOutside && actions.includes("mark_received")
        ? {
            trigger: "mark_received" as const,
            label: t("markReceived"),
            icon: HandCoins,
            note: undefined,
          }
        : null;

  return (
    <>
      <Header
        title={t("title")}
        subtitle={service.name}
        backTo={screen.back}
        aside={<StatusChip state={booking.state} announce />}
      />

      {failure ? (
        <Notice kind="error" live className="mb-6">
          {failure}
        </Notice>
      ) : null}

      {booking.state === "pending_payment" && booking.paymentDueAt ? (
        <Notice
          kind="attention"
          title={t("pendingTitle")}
          className="on-attention mb-6"
        >
          {t("pendingBody", {
            time: time(new Date(booking.paymentDueAt), locale),
          })}
        </Notice>
      ) : null}

      {booking.state === "payment_expired" ? (
        <Notice kind="info" title={t("expiredTitle")} className="mb-6">
          {t("expiredBody")}
        </Notice>
      ) : null}

      {booking.state === "finished" ? (
        settlesOutside ? (
          <Notice kind="attention" title={t("directTitle")} className="mb-6">
            {direct
              ? t("directBody", { amount: booking.totalAmount / 100 })
              : t("outsideBody")}
          </Notice>
        ) : (
          <Notice
            kind="attention"
            title={t("waitingCustomer")}
            className="mb-6"
          >
            {t("waitingCustomerBody", {
              amount: booking.balanceAmount / 100,
            })}
          </Notice>
        )
      ) : null}

      <Sheet>
        <SheetHeader title={dayAndTime(new Date(booking.startsAt), locale)} />
        <SheetBody className="flex flex-col gap-4">
          <DataList>
            <DataRow label={t("customer")}>
              {booking.customerName}
              <span className="tabular block text-note text-gray">
                {formatPhone(booking.customerPhone)}
              </span>
            </DataRow>
            <DataRow label={t("where")}>{booking.address}</DataRow>
            <DataRow label={t("origin")}>
              {booking.source === "public_link"
                ? t("originLink")
                : t("originManual")}
            </DataRow>
          </DataList>

          <div className="flex flex-col gap-2">
            <OpenInMaps address={booking.address}>
              {tCard("openInMaps")}
            </OpenInMaps>

            <ExternalButton
              icon={MessageCircle}
              href={`https://wa.me/55${booking.customerPhone}`}
              className="w-full justify-start text-left"
            >
              {t("whatsapp", { name: booking.customerName.split(" ")[0] })}
            </ExternalButton>
          </div>

          <div>
            <p className="text-note text-gray">{t("whatTheySaid")}</p>
            <p className="mt-1 text-body text-ink">
              {booking.problemDescription}
            </p>
          </div>
        </SheetBody>
      </Sheet>

      <Sheet className="mt-4">
        <SheetHeader title={t("money")} />
        <SheetBody>
          <dl className="flex flex-col">
            <MoneyRow
              label={priceClosed ? t("finalPrice") : t("priceSoFar")}
              cents={booking.totalAmount}
              note={priceClosed ? undefined : t("priceSoFarNote")}
            />

            {direct ? (
              <MoneyRow label={t("paymentHow")} text={t("paymentDirect")} />
            ) : null}

            {payments.map((payment) => (
              <MoneyRow
                key={payment.id}
                label={payment.kind === "deposit" ? t("deposit") : t("balance")}
                cents={payment.amount}
                note={
                  (payment.state === "held"
                    ? t("heldNote")
                    : t(`payment_${payment.state}` as "payment_held")) +
                  (payment.outsideApp ? ` ${t("outsideApp")}` : "") +
                  (payment.method
                    ? ` ${t("paidWith", { method: payment.method })}`
                    : "")
                }
              />
            ))}

            {!direct &&
            !balanceIn &&
            priceClosed &&
            booking.balanceAmount > 0 ? (
              <MoneyRow
                label={t("leftToGet")}
                cents={booking.balanceAmount}
                note={priceClosed ? t("leftToGetNow") : t("leftToGetLater")}
              />
            ) : null}
          </dl>
        </SheetBody>
      </Sheet>

      {review ? (
        <Sheet className="mt-4">
          <SheetHeader title={t("reviewGot", { rating: review.rating })} />
          <SheetBody>
            <p className="text-body text-ink">{review.comment ?? "—"}</p>
          </SheetBody>
        </Sheet>
      ) : null}

      {customer && (customer.unpaidCount > 0 || customer.disputeCount > 0) ? (
        <Notice kind="attention" title={t("customerHistory")} className="mt-4">
          {t("customerHistoryBody", {
            unpaid: customer.unpaidCount,
            disputes: customer.disputeCount,
          })}
        </Notice>
      ) : null}

      <Timeline transitions={booking.transitions} payments={payments} />

      <section className="mt-8 flex flex-col gap-2">
        {actions.includes("mark_received") &&
        mainAction?.trigger !== "mark_received" ? (
          <Button
            look="secondary"
            fullWidth
            icon={HandCoins}
            onClick={() => setConfirming("received")}
          >
            {t("markReceived")}
          </Button>
        ) : null}

        {actions.includes("mark_customer_no_show") ||
        actions.includes("cancel_by_provider") ? (
          <div className="flex gap-3">
            {actions.includes("mark_customer_no_show") ? (
              <Button
                id="detail-no-show"
                look="secondary"
                icon={UserX}
                className="min-w-0 flex-1 px-3! py-2 text-center leading-snug"
                onClick={() => setConfirming("no_show")}
              >
                {t("customerNoShow")}
              </Button>
            ) : null}

            {actions.includes("cancel_by_provider") ? (
              <Button
                id="detail-cancel"
                look="destructive"
                icon={Ban}
                className="min-w-0 flex-1 px-3! py-2 text-center leading-snug"
                onClick={() => setConfirming("cancel")}
              >
                {t("cancel")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

      {mainAction ? (
        <ActionBar aboveNav note={mainAction.note}>
          <Button
            look="primary"
            fullWidth
            icon={mainAction.icon}
            loading={working}
            onClick={() =>
              mainAction.trigger === "mark_received"
                ? setConfirming("received")
                : mainAction.trigger === "finish"
                  ? setClosing(true)
                  : run(() => api.startJob(booking.id))
            }
          >
            {mainAction.label}
          </Button>
        </ActionBar>
      ) : (
        <div className="h-8" />
      )}

      <FinishDialog
        open={closing}
        floorAmount={booking.totalAmount}
        paidAmount={heldAmount}
        canCharge={!settlesOutside}
        working={working}
        failure={closing ? failure : null}
        onClose={() => setClosing(false)}
        onFinish={(close) =>
          run(async () => {
            await api.finishJob(booking.id, close);
            setClosing(false);
          })
        }
      />

      <ConfirmDialog
        open={confirming === "cancel"}
        icon={Ban}
        returnFocusId="detail-cancel"
        failure={confirming === "cancel" ? failure : null}
        title={t("cancelConfirm", {
          name: booking.customerName,
          when: dayAndTime(new Date(booking.startsAt), locale),
        })}
        consequence={
          noDeposit
            ? t("cancelConsequenceNoDeposit", {
                name: booking.customerName.split(" ")[0],
              })
            : t("cancelConsequence", {
                name: booking.customerName.split(" ")[0],
                amount: booking.depositAmount / 100,
              })
        }
        confirmLabel={t("cancelYes")}
        loading={working}
        onCancel={() => setConfirming(null)}
        onConfirm={() => run(() => api.cancelByProvider(booking.id))}
      />

      <ConfirmDialog
        open={confirming === "no_show"}
        icon={UserX}
        returnFocusId="detail-no-show"
        failure={confirming === "no_show" ? failure : null}
        title={t("noShowConfirm", { name: booking.customerName })}
        consequence={
          noDeposit
            ? t("noShowConsequenceNoDeposit", {
                name: booking.customerName.split(" ")[0],
              })
            : t("noShowConsequence", { amount: booking.depositAmount / 100 })
        }
        confirmLabel={t("noShowYes")}
        loading={working}
        onCancel={() => setConfirming(null)}
        onConfirm={() => run(() => api.markCustomerNoShow(booking.id))}
      />

      <ConfirmDialog
        open={confirming === "received"}
        icon={HandCoins}
        failure={confirming === "received" ? failure : null}
        title={t("receivedConfirm")}
        consequence={t("receivedConsequence")}
        confirmLabel={t("receivedYes")}
        destructive={false}
        loading={working}
        onCancel={() => setConfirming(null)}
        onConfirm={() => run(() => api.markReceived(booking.id))}
      />
    </>
  );
}

function MoneyRow({
  label,
  cents,
  text,
  note,
}: {
  label: string;
  cents?: Cents;
  text?: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-body text-ink">{label}</dt>
        <dd className="text-right text-body font-semibold text-ink">
          {cents === undefined ? text : <Amount cents={cents} />}
        </dd>
      </div>
      {note ? <p className="text-note text-ink">{note}</p> : null}
    </div>
  );
}

function Timeline({
  transitions,
  payments,
}: {
  transitions: Detail["booking"]["transitions"];
  payments: Payment[];
}) {
  const t = useTranslations("panel.detail");
  const tState = useTranslations("stateProvider");
  const locale = useLocale() as Locale;

  const paid = payments.length > 0;
  const step = (state: Detail["booking"]["state"]) =>
    state === "confirmed" && paid ? t("stepConfirmed") : tState(state);

  return (
    <section className="mt-8">
      <h2 className="text-lead">{t("history")}</h2>

      <ol className="mt-4 flex flex-col">
        {[...transitions].reverse().map((transition, index, all) => (
          <li
            key={`${transition.at}-${index}`}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {index < all.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-border-strong"
              />
            ) : null}

            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border",
                index === 0
                  ? STATE_LOOK[transition.to].chip
                  : "border-border bg-surface text-gray",
              )}
            >
              {(() => {
                const Icon = STATE_LOOK[transition.to].icon;
                return <Icon className="size-4" />;
              })()}
            </span>

            <span className="min-w-0 flex-1 pt-0.5">
              <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span
                  className={cn(
                    "text-body font-medium",
                    index === 0 ? "text-ink" : "text-gray",
                  )}
                >
                  {step(transition.to)}
                </span>
                <span className="text-note text-gray">
                  {t(`actor_${transition.actor}` as "actor_provider")} ·{" "}
                  {t(`source_${transition.source}` as "source_panel")}
                </span>
              </span>

              <span className="tabular block text-note text-gray">
                {dayAndTime(new Date(transition.at), locale)}
              </span>

              {transition.note ? (
                <span className="block text-note text-gray">
                  {transition.note}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FinishDialog({
  open,
  floorAmount,
  paidAmount,
  canCharge,
  working,
  failure,
  onClose,
  onFinish,
}: {
  open: boolean;
  floorAmount: Cents;
  paidAmount: Cents;
  canCharge: boolean;
  working: boolean;
  failure: string | null;
  onClose: () => void;
  onFinish: (close: { finalAmount: Cents; chargeThroughApp: boolean }) => void;
}) {
  const t = useTranslations("panel.detail");
  const tUi = useTranslations("ui");
  const [amount, setAmount] = useState<Cents>(floorAmount);
  const [charge, setCharge] = useState(true);

  const left = Math.max(0, amount - paidAmount);

  return (
    <FormDialog
      open={open}
      title={t("finishTitle")}
      closeLabel={tUi("close")}
      focusId="finish-amount"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <MoneyField
          id="finish-amount"
          label={t("finishAmountLabel")}
          hint={t("finishAmountHint")}
          value={amount}
          onChange={setAmount}
        />

        <p className="text-note text-gray">
          {paidAmount > 0
            ? t("finishLeft", {
                paid: paidAmount / 100,
                left: left / 100,
              })
            : t("finishLeftNothingPaid", { left: left / 100 })}
        </p>

        {canCharge && left > 0 ? (
          <label className="touchable flex min-h-touch items-start gap-3 rounded-card border border-border bg-white px-3 py-2">
            <input
              type="checkbox"
              checked={charge}
              onChange={(event) => setCharge(event.target.checked)}
              className="mt-1 size-5 shrink-0 accent-[var(--color-action)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-body font-medium text-ink">
                {t("finishChargeLabel")}
              </span>
              <span className="block text-note text-gray">
                {charge ? t("finishChargeOn") : t("finishChargeOff")}
              </span>
            </span>
          </label>
        ) : null}

        {failure ? (
          <p role="alert" className="text-body text-red">
            {failure}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button
            look="secondary"
            className="min-w-0 flex-1 px-4!"
            disabled={working}
            onClick={onClose}
          >
            {tUi("back")}
          </Button>
          <Button
            look="primary"
            className="min-w-0 flex-1 px-4!"
            loading={working}
            onClick={() =>
              onFinish({
                finalAmount: amount,
                chargeThroughApp: canCharge && charge,
              })
            }
          >
            {t("finishConfirm")}
          </Button>
        </div>
      </div>
    </FormDialog>
  );
}
