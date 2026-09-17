import { hoursBetween, now } from "@/utils/time/clock";
import type { Customer, Subscription } from "@/types/provider";
import type { DepositMode,  Timestamp } from "@/types/booking";

export const HOURS_FREE_CANCELLATION = 24;

export const HOURS_AUTO_RELEASE = 48;

export const HOURS_DISPUTE = 48;

export const HOURS_PROVIDER_NO_SHOW_REFUND = 4;

export const DAYS_UNTIL_UNPAID = 7;

export const MINUTES_TO_PAY_DEPOSIT = 15;

export function paymentDueAt(createdAt: Timestamp): Timestamp {
  return new Date(
    new Date(createdAt).getTime() + MINUTES_TO_PAY_DEPOSIT * 60_000,
  ).toISOString();
}

export function paymentWindowOver(dueAt: Timestamp | undefined, when = now()) {
  return dueAt !== undefined && when.getTime() >= new Date(dueAt).getTime();
}

export const DEFAULT_DEPOSIT = 30;
export const MIN_DEPOSIT = 30;
export const MAX_DEPOSIT = 80;

export function clampDeposit(percent: number) {
  return Math.min(MAX_DEPOSIT, Math.max(MIN_DEPOSIT, Math.round(percent)));
}

export const UNPAID_LIMIT = 2;
export const DISPUTE_LIMIT = 2;

export const MONTHLY_FEE_CENTS = 2990;

export const TRIAL_DAYS = 15;

export type SubscriptionAccess = "trial" | "active" | "blocked";

export function subscriptionAccess(
  subscription: Pick<Subscription, "state" | "nextChargeAt" | "lastPaidAt">,
  when = now(),
): SubscriptionAccess {
  if (when.getTime() >= new Date(subscription.nextChargeAt).getTime()) {
    return "blocked";
  }
  if (subscription.state === "trial") return "trial";
  if (subscription.state === "cancelled" && !subscription.lastPaidAt) {
    return "trial";
  }
  return "active";
}

export function cancellationRefundsAll(startsAt: Timestamp, when = now()) {
  return hoursBetween(when, startsAt) > HOURS_FREE_CANCELLATION;
}

export function hoursUntilCancellationDeadline(
  startsAt: Timestamp,
  when = now(),
) {
  return hoursBetween(when, startsAt) - HOURS_FREE_CANCELLATION;
}

export function withinDisputeWindow(finishedAt: Timestamp, when = now()) {
  return hoursBetween(finishedAt, when) <= HOURS_DISPUTE;
}

export function mustPayInFull(customer: Customer | undefined) {
  if (!customer) return false;
  return (
    customer.unpaidCount >= UNPAID_LIMIT ||
    customer.disputeCount >= DISPUTE_LIMIT
  );
}

export function publicDepositMode(collectsDeposit: boolean): DepositMode {
  return collectsDeposit ? "with_deposit" : "pay_direct";
}

export function chargesThroughApp(mode: DepositMode) {
  return mode === "with_deposit" || mode === "no_deposit";
}
