"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { messageFrom } from "@/utils/api/errors";
import { useBooking } from "@/utils/api/queries";
import { chargesThroughApp } from "@/utils/booking/rules";
import { backHref } from "@/utils/panel/back";

const PRICE_CLOSED = ["finished", "paid", "reviewed", "unpaid"];

export function useBookingDetail(id: string) {
  const from = useSearchParams().get("de") ?? undefined;
  const [confirming, setConfirming] = useState<
    "cancel" | "no_show" | "received" | null
  >(null);
  const [closing, setClosing] = useState(false);
  const [working, setWorking] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const { data, loading, error, reload } = useBooking(id);

  const booking = data?.booking;
  const payments = data?.payments ?? [];

  async function run(action: () => Promise<unknown>) {
    setWorking(true);
    setFailure(null);

    try {
      await action();
      setConfirming(null);
      await reload();
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setWorking(false);
    }
  }

  return {
    back: backHref(from),
    detail: data,
    loading,
    error,
    reload,
    confirming,
    setConfirming,
    closing,
    setClosing,
    working,
    failure,
    setFailure,
    run,
    heldAmount: payments
      .filter((payment) => payment.state === "held")
      .reduce((total, payment) => total + payment.amount, 0),
    settlesOutside: booking ? !chargesThroughApp(booking.depositMode) : false,
    priceClosed: booking ? PRICE_CLOSED.includes(booking.state) : false,
    balanceIn: payments.some(
      (payment) =>
        payment.kind === "balance" &&
        (payment.state === "held" || payment.state === "released"),
    ),
    direct: booking?.depositMode === "pay_direct",
    noDeposit: booking?.depositAmount === 0,
  };
}
