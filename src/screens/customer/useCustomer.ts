"use client";

import { useState } from "react";

import { messageFrom } from "@/utils/api/errors";
import { useBookingByToken } from "@/utils/api/queries";
import {
  cancellationRefundsAll,
  HOURS_FREE_CANCELLATION,
} from "@/utils/booking/rules";
import { HOUR } from "@/utils/time/clock";

const PRICED = ["finished", "unpaid", "paid", "reviewed", "disputed"];

export function useCustomer(token: string) {
  const [confirming, setConfirming] = useState<"cancel" | "dispute" | null>(
    null,
  );
  const [working, setWorking] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const { data, loading, error, reload } = useBookingByToken(token);

  const payments = data?.payments ?? [];
  const booking = data?.booking;
  const startsAt = booking ? new Date(booking.startsAt) : new Date();

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
    view: data,
    reload,
    loading,
    error,
    confirming,
    setConfirming,
    working,
    failure,
    run,
    startsAt,
    paid: payments
      .filter(
        (payment) =>
          payment.state !== "pending" && payment.state !== "refunded",
      )
      .reduce((total, payment) => total + payment.amount, 0),
    refunded: payments
      .filter((payment) => payment.state === "refunded")
      .reduce((total, payment) => total + payment.amount, 0),
    depositMethod: payments.find(
      (payment) => payment.kind === "deposit" && payment.method,
    )?.method,
    stillDue: payments
      .filter((payment) => payment.state === "pending")
      .reduce((total, payment) => total + payment.amount, 0),
    refundsAll: booking ? cancellationRefundsAll(booking.startsAt) : true,
    deadline: new Date(startsAt.getTime() - HOURS_FREE_CANCELLATION * HOUR),
    priced: booking ? PRICED.includes(booking.state) : false,
    direct: booking?.depositMode === "pay_direct",
    noDeposit: booking?.depositAmount === 0,
  };
}
