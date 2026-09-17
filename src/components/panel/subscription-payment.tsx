"use client";

import { LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  cardFieldSpecs,
  PaymentMethodForm,
} from "@/components/payment/payment-method-form";
import { ActionBar } from "@/components/ui/action-bar";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { FormProblems } from "@/components/ui/form-problems";
import { Header } from "@/components/ui/header";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody } from "@/components/ui/sheet";
import { useRouter } from "@/utils/navigation";
import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { useSubscription } from "@/utils/api/queries";
import { TRIAL_DAYS } from "@/utils/booking/rules";
import { longDay } from "@/utils/format/date";
import { goToField, hasErrors, problemsFrom } from "@/utils/forms/problems";
import {
  cardErrors,
  EMPTY_CARD,
  tokenizeCard,
  type CardInput,
} from "@/utils/payments/card";
import type { Locale } from "@/i18n/config";
import type { PaymentMethod } from "@/types/booking";

export function SubscriptionPayment() {
  const t = useTranslations("subscription");
  const tPay = useTranslations("payment");
  const tField = useTranslations("fieldNames");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const { data, loading } = useSubscription();

  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [card, setCard] = useState<CardInput>(EMPTY_CARD);
  const [attempted, setAttempted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (loading || !data)
    return <ListSkeleton rows={2} lead="none" className="mt-6" />;

  const { subscription, access } = data;
  const blocked = access === "blocked";
  const byCard = method !== "pix";
  const amount = subscription.monthlyAmount;
  const endsOn = longDay(new Date(subscription.nextChargeAt), locale);

  const found = byCard ? cardErrors(card) : {};
  const fields = byCard
    ? cardFieldSpecs(
        {
          number: tField("cardNumber"),
          name: tField("cardName"),
          expiry: tField("cardExpiry"),
          cvv: tField("cardCvv"),
        },
        "subscription-card",
        card,
      )
    : [];
  const errors = attempted ? found : {};

  async function pay() {
    if (hasErrors(found)) {
      setAttempted(true);
      goToField(problemsFrom(found, fields)[0]?.target);
      return;
    }

    setPaying(true);
    setFailure(null);

    try {
      if (method === "pix") {
        await api.paySubscription({ method: "pix" });
      } else {
        const cardToken = await tokenizeCard(card);
        await api.paySubscription({ method, cardToken });
      }
      if (!blocked) router.replace("/painel/perfil/assinatura");
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      {blocked ? (
        <header className="animate-rise pt-8">
          <h1 className="text-title">
            {subscription.state === "cancelled"
              ? t("cancelledTitle")
              : subscription.lastPaidAt
                ? t("expiredTitle")
                : t("trialOverTitle", { days: TRIAL_DAYS })}
          </h1>
          <p className="mt-2 text-body text-gray">{t("blockedBody")}</p>
        </header>
      ) : (
        <Header title={t("payTitle")} backTo="/painel/perfil/assinatura" />
      )}

      <Sheet className={blocked ? "mt-6" : undefined}>
        <SheetBody className="flex flex-col gap-2">
          <p className="text-note text-gray">{t("amountLabel")}</p>
          <p className="flex flex-wrap items-baseline gap-2">
            <Amount cents={amount} size="lead" className="text-ink" />
            <span className="text-note text-gray">{t("perMonth")}</span>
          </p>
          <p className="text-note text-ink">
            {blocked
              ? t("linkPaused")
              : access === "trial"
                ? t("keepsFreeDays", { date: endsOn })
                : t("extends", { date: endsOn })}
          </p>
        </SheetBody>
      </Sheet>

      <PaymentMethodForm
        className="mt-8"
        method={method}
        onMethodChange={(next) => {
          setMethod(next);
          setFailure(null);
        }}
        card={card}
        onCardChange={setCard}
        idPrefix="subscription-card"
        errors={attempted && byCard ? found : undefined}
        pixSeed={`assinatura-${subscription.providerId}`}
        pixCode={`00020126sochamarassinatura${subscription.providerId}5204000053039865802BR6009SAO PAULO`}
      />

      {failure ? (
        <Notice kind="error" live className="mt-6">
          {failure}
        </Notice>
      ) : null}

      {blocked ? (
        <Button
          look="plain"
          icon={LogOut}
          className="mt-6"
          onClick={async () => {
            await api.signOut();
            router.push("/");
          }}
        >
          {t("signOut")}
        </Button>
      ) : null}

      <ActionBar
        aboveNav={!blocked}
        note={tPay("simulateNote")}
        alert={<FormProblems problems={problemsFrom(errors, fields)} />}
      >
        <Button look="primary" fullWidth loading={paying} onClick={pay}>
          {byCard ? tPay("payCard", { amount: amount / 100 }) : tPay("simulate")}
        </Button>
      </ActionBar>
    </>
  );
}
