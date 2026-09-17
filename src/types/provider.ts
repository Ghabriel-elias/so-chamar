import type { Cents, Timestamp } from "./booking";

export type Provider = {
  id: string;
  slug: string;
  name: string;
  photo: string;
  phone: string;
  email: string;
  city: string;
  cityCode: number | null;

  collectsDeposit: boolean;

  depositPercent: number;

  createdAt: Timestamp;
};

export type ProviderStats = {
  rating: number;
  reviewCount: number;
  showUpRate: number | null;
  cancellationRate: number;
  jobCount: number;
};

export type Service = {
  id: string;
  providerId: string;
  catalogId: string;
  name: string;
  priceFrom: Cents;
  durationMinutes: number;
  active: boolean;
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WorkingHours = {
  id: string;
  providerId: string;
  weekday: Weekday;
  start: string;
  end: string;
  lunch?: { start: string; end: string } | null;
  active: boolean;
};

export type Customer = {
  phone: string;
  name: string;
  unpaidCount: number;
  disputeCount: number;
  bookingCount: number;
  firstSeenAt: Timestamp;
};

export type SubscriptionState = "active" | "past_due" | "cancelled" | "trial";

export type Subscription = {
  providerId: string;
  state: SubscriptionState;
  monthlyAmount: Cents;
  nextChargeAt: Timestamp;
  since: Timestamp;
  lastPaidAt?: Timestamp;
  cancelledAt?: Timestamp;
};

export type MessageTarget = "customer" | "provider";

export type WhatsappMessage = {
  id: string;
  template: string;
  target: MessageTarget;
  phone: string;
  variables: Record<string, string | number>;
  bookingId?: string;
  at: Timestamp;
};
