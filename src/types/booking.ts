
export const BOOKING_STATES = [
  "pending_payment",
  "confirmed",
  "in_progress",
  "finished",
  "paid",
  "reviewed",
  "payment_expired",
  "cancelled_by_customer",
  "cancelled_by_provider",
  "customer_no_show",
  "provider_no_show",
  "unpaid",
  "disputed",
] as const;

export type BookingState = (typeof BOOKING_STATES)[number];

export const TERMINAL_STATES = [
  "payment_expired",
  "cancelled_by_customer",
  "cancelled_by_provider",
  "customer_no_show",
  "provider_no_show",
  "unpaid",
  "disputed",
] as const satisfies readonly BookingState[];

export type TerminalState = (typeof TERMINAL_STATES)[number];

export function isTerminal(state: BookingState): state is TerminalState {
  return (TERMINAL_STATES as readonly BookingState[]).includes(state);
}

export type Viewpoint = "provider" | "customer";

export type BookingSource = "public_link" | "manual_entry";

export type DepositMode =
  | "with_deposit"
  | "no_deposit"
  | "paid_outside"
  | "pay_direct";

export type Cents = number;

export type Timestamp = string;

export type TransitionActor = "provider" | "customer" | "system";

export type TransitionSource =
  | "panel"
  | "public_link"
  | "customer_link"
  | "job"
  | "debug";

export type Transition = {
  from: BookingState | null;
  to: BookingState;
  at: Timestamp;
  actor: TransitionActor;
  source: TransitionSource;
  note?: string;
};

export type PaymentKind = "deposit" | "balance";

export type PaymentState = "pending" | "held" | "released" | "refunded";

export type PaymentMethod = "pix" | "credit_card" | "debit_card";

export type Payment = {
  id: string;
  bookingId: string;
  kind: PaymentKind;
  amount: Cents;
  state: PaymentState;
  createdAt: Timestamp;
  paidAt?: Timestamp;
  releasedAt?: Timestamp;
  refundedAt?: Timestamp;
  outsideApp?: boolean;
  method?: PaymentMethod;
};

export type Review = {
  id: string;
  bookingId: string;
  providerId: string;
  rating: number;
  comment?: string;
  author: string;
  createdAt: Timestamp;
};

export type Booking = {
  id: string;
  providerId: string;
  serviceId: string;
  customerPhone: string;
  customerName: string;
  address: string;
  problemDescription: string;

  startsAt: Timestamp;
  durationMinutes: number;

  state: BookingState;
  source: BookingSource;
  depositMode: DepositMode;

  totalAmount: Cents;
  depositAmount: Cents;
  balanceAmount: Cents;
  depositPercent: number;

  customerToken: string;

  paymentDueAt?: Timestamp;

  transitions: Transition[];

  providerShowedUp?: boolean;
  showUpAnsweredAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
};
