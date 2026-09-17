"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cardFieldSpecs } from "@/components/payment/payment-method-form";
import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { useBookingByToken } from "@/utils/api/queries";
import { BOOKING_STEPS } from "@/utils/booking/draft";
import { forgetPendingPayment } from "@/utils/booking/pending-payment";
import {
  goToField,
  hasErrors,
  problemsFrom,
  type FieldErrors,
  type FieldSpec,
} from "@/utils/forms/problems";
import { useStepArrival } from "@/utils/motion/step-arrival";
import { useRouter } from "@/utils/navigation";
import {
  cardErrors,
  EMPTY_CARD,
  tokenizeCard,
  type CardInput,
} from "@/utils/payments/card";
import { now } from "@/utils/time/clock";
import type { PaymentMethod } from "@/types/booking";

export function useCustomerPagamento(token: string) {
  const tError = useTranslations("errors");
  const tField = useTranslations("fieldNames");
  const router = useRouter();

  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [card, setCard] = useState<CardInput>(EMPTY_CARD);
  const [showedUp, setShowedUp] = useState<"yes" | "no" | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const arrival = useStepArrival("booking", BOOKING_STEPS);
  const { data, loading, reload } = useBookingByToken(token);

  const dueAt =
    data?.booking.state === "pending_payment"
      ? data.booking.paymentDueAt
      : undefined;

  useEffect(() => {
    if (!dueAt) return;
    const interval = window.setInterval(() => {
      setTick((tick) => tick + 1);
      if (now().getTime() >= new Date(dueAt).getTime()) void reload();
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [dueAt, reload]);

  const actions = data?.actions ?? [];
  const payingDeposit = actions.includes("pay_deposit");
  const payingBalance = actions.includes("pay_balance");
  const byCard = payingDeposit && method !== "pix";

  const found: FieldErrors = {
    ...(byCard ? cardErrors(card) : {}),
    showUp: payingBalance && showedUp === null ? "showUpRequired" : null,
  };

  const fields: FieldSpec[] = [
    ...(byCard
      ? cardFieldSpecs(
          {
            number: tField("cardNumber"),
            name: tField("cardName"),
            expiry: tField("cardExpiry"),
            cvv: tField("cardCvv"),
          },
          "deposit-card",
          card,
        )
      : []),
    {
      key: "showUp",
      name: tField("showUp"),
      target: "payment-showed-up",
      empty: true,
    },
  ];

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
      if (payingDeposit) {
        if (method === "pix") {
          await api.payDeposit(token, { method: "pix" });
        } else {
          const cardToken = await tokenizeCard(card);
          await api.payDeposit(token, { method, cardToken });
        }
        forgetPendingPayment();
      } else {
        await api.payBalance(token, { providerShowedUp: showedUp === "yes" });
      }

      router.replace(`/a/${token}`);
    } catch (problem) {
      setFailure(messageFrom(problem));
      setPaying(false);
    }
  }

  return {
    view: data,
    loading,
    arrival,
    method,
    setMethod,
    chooseMethod: (next: PaymentMethod) => {
      setMethod(next);
      setFailure(null);
    },
    card,
    setCard,
    showedUp,
    setShowedUp,
    paying,
    failure,
    payingDeposit,
    payingBalance,
    byCard,
    amount: payingDeposit
      ? (data?.booking.depositAmount ?? 0)
      : (data?.booking.balanceAmount ?? 0),
    code: `00020126sochamar${token}5204000053039865802BR6009SAO PAULO`,
    cardErrors: attempted && byCard ? cardErrors(card) : undefined,
    problems: problemsFrom(errors, fields),
    errorFor: (key: string) =>
      errors[key] ? tError(errors[key] as string) : undefined,
    pay,
  };
}
