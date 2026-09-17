import { moveMoney } from "@/utils/booking/money";
import {
  chargesThroughApp,
  DAYS_UNTIL_UNPAID,
  HOURS_AUTO_RELEASE,
  HOURS_PROVIDER_NO_SHOW_REFUND,
  MINUTES_TO_PAY_DEPOSIT,
  paymentWindowOver,
} from "@/utils/booking/rules";
import { DAY, hoursBetween, now } from "@/utils/time/clock";
import type { Booking, BookingState } from "@/types/booking";

import { newId } from "./store";
import type { Store } from "./fixtures";
import { fireTrigger, queueMessage } from "./engine";
import { SITE_DOMAIN } from "@/utils/site";

export type JobsRun = string[];

function enteredStateAt(
  booking: Booking,
  state: BookingState,
): string | undefined {
  return [...booking.transitions].reverse().find((t) => t.to === state)?.at;
}

export function expireUnpaidDeposits(store: Store): number {
  const targets = store.bookings.filter(
    (booking) =>
      booking.state === "pending_payment" &&
      paymentWindowOver(booking.paymentDueAt),
  );

  for (const booking of targets) {
    fireTrigger(store, booking.id, "expire_payment", {
      actor: "system",
      source: "job",
      note: `${MINUTES_TO_PAY_DEPOSIT} minutes without the deposit being paid.`,
    });
  }

  return targets.length;
}

function refundForProviderNoShow(store: Store): number {
  const targets = store.bookings.filter(
    (booking) =>
      booking.state === "confirmed" &&
      hoursBetween(booking.startsAt, now()) >= HOURS_PROVIDER_NO_SHOW_REFUND,
  );

  for (const booking of targets) {
    fireTrigger(store, booking.id, "mark_provider_no_show", {
      actor: "system",
      source: "job",
      note: "Four hours past the slot with nobody pressing anything.",
    });
  }

  return targets.length;
}

function autoRelease(store: Store): number {
  const targets = store.bookings.filter((booking) => {
    if (booking.state !== "paid") return false;
    if (booking.providerShowedUp !== undefined) return false;

    const finishedAt = enteredStateAt(booking, "finished");
    if (!finishedAt) return false;

    return hoursBetween(finishedAt, now()) >= HOURS_AUTO_RELEASE;
  });

  for (const booking of targets) {
    store.payments = moveMoney({
      effect: "release_all",
      toState: "paid",
      booking,
      payments: store.payments,
      newId: () => newId("pm"),
    });
  }

  return targets.length;
}

function markUnpaid(store: Store): number {
  const targets = store.bookings.filter((booking) => {
    if (booking.state !== "finished") return false;
    if (!chargesThroughApp(booking.depositMode)) return false;

    const finishedAt = enteredStateAt(booking, "finished");
    if (!finishedAt) return false;

    return hoursBetween(finishedAt, now()) >= DAYS_UNTIL_UNPAID * 24;
  });

  for (const booking of targets) {
    fireTrigger(store, booking.id, "mark_unpaid", {
      actor: "system",
      source: "job",
      note: "Seven days without the balance being paid.",
    });
  }

  return targets.length;
}

function dayBeforeReminder(store: Store): number {
  const limit = now().getTime() + DAY;
  let sent = 0;

  for (const booking of store.bookings) {
    if (booking.state !== "confirmed") continue;

    const startsAt = new Date(booking.startsAt).getTime();
    if (startsAt > limit || startsAt < now().getTime()) continue;

    const alreadySent = store.messages.some(
      (message) =>
        message.bookingId === booking.id &&
        message.template === "day_before_reminder",
    );
    if (alreadySent) continue;

    const service = store.services.find((item) => item.id === booking.serviceId);

    queueMessage(store, {
      template: "day_before_reminder",
      target: "customer",
      phone: booking.customerPhone,
      bookingId: booking.id,
      variables: {
        provider:
          store.providers.find((record) => record.id === booking.providerId)
            ?.name ?? "",
        service: service?.name ?? "",
        when: booking.startsAt,
        link: `${SITE_DOMAIN}/a/${booking.customerToken}`,
      },
    });

    sent += 1;
  }

  return sent;
}

function blockUnpaidSubscriptions(store: Store): number {
  let blocked = 0;

  for (const subscription of store.subscriptions) {
    if (subscription.state === "past_due" || subscription.state === "cancelled") {
      continue;
    }
    if (now().getTime() < new Date(subscription.nextChargeAt).getTime()) continue;

    subscription.state = "past_due";
    blocked += 1;
  }

  return blocked;
}

export function runJobs(store: Store): JobsRun {
  const ran: JobsRun = [];

  const record = (name: string, count: number) => {
    if (count > 0) ran.push(`${name}: ${count}`);
  };

  record("payment_expired", expireUnpaidDeposits(store));
  record("provider_no_show_refund", refundForProviderNoShow(store));
  record("auto_release_48h", autoRelease(store));
  record("mark_unpaid_7_days", markUnpaid(store));
  record("day_before_reminder", dayBeforeReminder(store));
  record("subscription_blocked", blockUnpaidSubscriptions(store));

  return ran;
}
