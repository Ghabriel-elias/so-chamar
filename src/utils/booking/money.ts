import type { MoneyEffect } from "@/utils/booking/machine";
import {
  cancellationRefundsAll,
  chargesThroughApp,
} from "@/utils/booking/rules";
import { nowIso } from "@/utils/time/clock";
import { zonedMonthKey } from "@/utils/time/zone";
import { depositOf } from "@/utils/format/currency";
import type {
  Booking,
  BookingState,
  Cents,
  DepositMode,
  Payment,
  Timestamp,
} from "@/types/booking";

export function computeAmounts({
  price,
  depositPercent,
  depositMode,
  visitDeduction = 0,
}: {
  price: Cents;
  depositPercent: number;
  depositMode: DepositMode;
  visitDeduction?: Cents;
}): { total: Cents; deposit: Cents; balance: Cents } {
  const total = Math.max(0, price - visitDeduction);

  if (depositMode !== "with_deposit") {
    return { total, deposit: 0, balance: total };
  }

  const deposit = Math.min(total, depositOf(total, depositPercent));
  return { total, deposit, balance: total - deposit };
}

export function initialPayments(
  booking: Booking,
  newId: () => string,
): Payment[] {
  const createdAt = booking.createdAt;

  if (booking.depositMode === "paid_outside") {
    return [
      {
        id: newId(),
        bookingId: booking.id,
        kind: "deposit",
        amount: booking.totalAmount,
        state: "released",
        createdAt,
        paidAt: createdAt,
        releasedAt: createdAt,
        outsideApp: true,
      },
    ];
  }

  if (booking.depositAmount <= 0) return [];

  return [
    {
      id: newId(),
      bookingId: booking.id,
      kind: "deposit",
      amount: booking.depositAmount,
      state: "pending",
      createdAt,
    },
  ];
}

export function resolveEffect(
  effect: MoneyEffect,
  toState: BookingState,
  booking: Booking,
): MoneyEffect {
  if (
    toState === "cancelled_by_customer" &&
    !cancellationRefundsAll(booking.startsAt)
  ) {
    return "deposit_to_provider";
  }

  return effect;
}

export function moveMoney({
  effect,
  toState,
  booking,
  payments,
  newId,
}: {
  effect: MoneyEffect;
  toState: BookingState;
  booking: Booking;
  payments: Payment[];
  newId: () => string;
}): Payment[] {
  const at = nowIso();
  const mine = payments.filter((payment) => payment.bookingId === booking.id);
  const others = payments.filter(
    (payment) => payment.bookingId !== booking.id,
  );

  const resolved = resolveEffect(effect, toState, booking);

  function mapMine(transform: (payment: Payment) => Payment) {
    return [...others, ...mine.map(transform)];
  }

  switch (resolved) {
    case "none":
      return payments;

    case "hold_deposit":
      return mapMine((payment) =>
        payment.kind === "deposit" && payment.state === "pending"
          ? { ...payment, state: "held", paidAt: at }
          : payment,
      );

    case "charge_balance": {
      if (booking.balanceAmount <= 0) return payments;
      if (!chargesThroughApp(booking.depositMode)) return payments;

      const alreadyThere = mine.some((payment) => payment.kind === "balance");
      if (alreadyThere) return payments;

      return [
        ...others,
        ...mine,
        {
          id: newId(),
          bookingId: booking.id,
          kind: "balance",
          amount: booking.balanceAmount,
          state: "pending",
          createdAt: at,
        },
      ];
    }

    case "hold_balance":
      return mapMine((payment) =>
        payment.kind === "balance" && payment.state === "pending"
          ? { ...payment, state: "held", paidAt: at }
          : payment,
      );

    case "release_all":
      return mapMine((payment) =>
        payment.state === "pending" || payment.state === "held"
          ? {
              ...payment,
              state: "released",
              paidAt: payment.paidAt ?? at,
              releasedAt: at,
            }
          : payment,
      );

    case "deposit_to_provider":
      return mapMine((payment) => {
        if (payment.kind === "deposit" && payment.state === "held") {
          return { ...payment, state: "released", releasedAt: at };
        }
        return payment;
      });

    case "void_charge":
      return [
        ...others,
        ...mine.filter((payment) => payment.state !== "pending"),
      ];

    case "refund_all":
      return mapMine((payment) =>
        payment.state === "held" || payment.state === "pending"
          ? { ...payment, state: "refunded", refundedAt: at }
          : payment,
      );
  }
}

const OPEN_STATES: readonly BookingState[] = ["confirmed", "in_progress", "finished"];

export type MoneyEntryKind =
  | "received"
  | "held"
  | "incoming"
  | "refunded"
  | "no_shows";

export const MONTHLY_KINDS: readonly MoneyEntryKind[] = [
  "received",
  "refunded",
  "no_shows",
];

export type MoneyLine = {
  booking: Booking;
  amount: Cents;
  at: Timestamp;
  payments: Payment[];
};

export function moneyLines({
  kind,
  month,
  bookings,
  payments,
}: {
  kind: MoneyEntryKind;
  month: string;
  bookings: Booking[];
  payments: Payment[];
}): MoneyLine[] {
  const inMonth = (instant?: Timestamp) =>
    instant !== undefined && zonedMonthKey(new Date(instant)) === month;
  const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));

  function perJob(
    match: (payment: Payment) => boolean,
    when: (payment: Payment) => Timestamp | undefined,
  ): MoneyLine[] {
    const lines = new Map<string, MoneyLine>();

    for (const payment of payments) {
      if (!match(payment)) continue;
      const booking = bookingsById.get(payment.bookingId);
      if (!booking) continue;

      const at = when(payment) ?? payment.createdAt;
      const line = lines.get(booking.id);
      if (line) {
        line.amount += payment.amount;
        line.payments.push(payment);
        if (at > line.at) line.at = at;
      } else {
        lines.set(booking.id, {
          booking,
          amount: payment.amount,
          at,
          payments: [payment],
        });
      }
    }

    return [...lines.values()];
  }

  const newestFirst = (a: MoneyLine, b: MoneyLine) => b.at.localeCompare(a.at);
  const soonestFirst = (a: MoneyLine, b: MoneyLine) => a.at.localeCompare(b.at);
  const paymentsOf = (booking: Booking) =>
    payments.filter((payment) => payment.bookingId === booking.id);

  switch (kind) {
    case "received":
      return perJob(
        (payment) => payment.state === "released" && inMonth(payment.releasedAt),
        (payment) => payment.releasedAt,
      ).sort(newestFirst);

    case "refunded":
      return perJob(
        (payment) => payment.state === "refunded" && inMonth(payment.refundedAt),
        (payment) => payment.refundedAt,
      ).sort(newestFirst);

    case "held":
      return perJob(
        (payment) => payment.state === "held",
        (payment) => payment.paidAt,
      ).sort(newestFirst);

    case "incoming":
      return bookings
        .filter(
          (booking) =>
            OPEN_STATES.includes(booking.state) &&
            chargesThroughApp(booking.depositMode) &&
            booking.balanceAmount > 0 &&
            !paymentsOf(booking).some(
              (payment) => payment.kind === "balance" && payment.state !== "pending",
            ),
        )
        .map((booking) => ({
          booking,
          amount: booking.balanceAmount,
          at: booking.startsAt,
          payments: paymentsOf(booking),
        }))
        .sort(soonestFirst);

    case "no_shows":
      return bookings
        .filter(
          (booking) =>
            booking.state === "customer_no_show" && inMonth(booking.startsAt),
        )
        .map((booking) => {
          const kept = paymentsOf(booking).filter(
            (payment) => payment.kind === "deposit" && payment.state === "released",
          );
          return {
            booking,
            amount: kept.reduce((total, payment) => total + payment.amount, 0),
            at: booking.startsAt,
            payments: kept,
          };
        })
        .sort(newestFirst);
  }
}

export type MoneySummary = {
  month: string;
  received: Cents;
  refunded: Cents;
  customerNoShows: number;
  held: Cents;
  incoming: Cents;
  counts: Record<MoneyEntryKind, number>;
};

export function summariseMoney({
  bookings,
  payments,
  month,
}: {
  bookings: Booking[];
  payments: Payment[];
  month: string;
}): MoneySummary {
  const linesOf = (kind: MoneyEntryKind) =>
    moneyLines({ kind, month, bookings, payments });
  const sum = (lines: MoneyLine[]) =>
    lines.reduce((total, line) => total + line.amount, 0);

  const received = linesOf("received");
  const refunded = linesOf("refunded");
  const noShows = linesOf("no_shows");
  const held = linesOf("held");
  const incoming = linesOf("incoming");

  return {
    month,
    received: sum(received),
    refunded: sum(refunded),
    customerNoShows: noShows.length,
    held: sum(held),
    incoming: sum(incoming),
    counts: {
      received: received.length,
      refunded: refunded.length,
      no_shows: noShows.length,
      held: held.length,
      incoming: incoming.length,
    },
  };
}
