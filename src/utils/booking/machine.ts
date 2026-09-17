import { chargesThroughApp } from "@/utils/booking/rules";
import { nowIso } from "@/utils/time/clock";
import type {
  Booking,
  BookingState,
  Transition,
  TransitionActor,
  TransitionSource,
} from "@/types/booking";

export type Trigger =
  | "create"
  | "pay_deposit"
  | "start"
  | "finish"
  | "pay_balance"
  | "mark_received"
  | "review"
  | "cancel_by_customer"
  | "cancel_by_provider"
  | "mark_customer_no_show"
  | "mark_provider_no_show"
  | "mark_unpaid"
  | "expire_payment"
  | "dispute";

export type MoneyEffect =
  | "none"
  | "hold_deposit"
  | "charge_balance"
  | "hold_balance"
  | "release_all"
  | "deposit_to_provider"
  | "refund_all"
  | "void_charge";

export type TransitionRule = {
  from: BookingState;
  to: BookingState;
  trigger: Trigger;
  actors: readonly TransitionActor[];
  effect: MoneyEffect;
  why: string;
};

export const TRANSITIONS: readonly TransitionRule[] = [
  {
    from: "pending_payment",
    to: "confirmed",
    trigger: "pay_deposit",
    actors: ["customer"],
    effect: "hold_deposit",
    why: "The customer paid the deposit. It is held; nobody has received it.",
  },
  {
    from: "pending_payment",
    to: "cancelled_by_customer",
    trigger: "cancel_by_customer",
    actors: ["customer"],
    effect: "refund_all",
    why: "Backed out before paying. There is nothing to keep.",
  },
  {
    from: "pending_payment",
    to: "cancelled_by_provider",
    trigger: "cancel_by_provider",
    actors: ["provider"],
    effect: "refund_all",
    why: "The provider called it off before the customer paid.",
  },
  {
    from: "pending_payment",
    to: "payment_expired",
    trigger: "expire_payment",
    actors: ["system"],
    effect: "void_charge",
    why: "Thirty minutes without the deposit. Nothing was paid: the charge is called off and the slot goes back on the list.",
  },

  {
    from: "confirmed",
    to: "in_progress",
    trigger: "start",
    actors: ["provider"],
    effect: "none",
    why: "The provider arrived and pressed start. No money moves.",
  },
  {
    from: "confirmed",
    to: "cancelled_by_customer",
    trigger: "cancel_by_customer",
    actors: ["customer"],
    effect: "refund_all",
    why: "More than 24h out it all goes back; under that the deposit stays with the provider. money.ts decides, looking at the clock.",
  },
  {
    from: "confirmed",
    to: "cancelled_by_provider",
    trigger: "cancel_by_provider",
    actors: ["provider"],
    effect: "refund_all",
    why: "Provider cancelled: full refund, and it counts towards his public cancellation rate.",
  },
  {
    from: "confirmed",
    to: "customer_no_show",
    trigger: "mark_customer_no_show",
    actors: ["provider"],
    effect: "deposit_to_provider",
    why: "He went and nobody was there. The deposit covers the lost morning.",
  },
  {
    from: "confirmed",
    to: "provider_no_show",
    trigger: "mark_provider_no_show",
    actors: ["system"],
    effect: "refund_all",
    why: "Four hours past the slot and nobody pressed anything. Automatic refund.",
  },

  {
    from: "in_progress",
    to: "finished",
    trigger: "finish",
    actors: ["provider"],
    effect: "charge_balance",
    why: "The job is done. This fires the balance charge — and releases NOTHING. It is the lock against finishing a job you never went to.",
  },

  {
    from: "finished",
    to: "paid",
    trigger: "pay_balance",
    actors: ["customer"],
    effect: "hold_balance",
    why: "The customer paid the balance. The money still does NOT leave: it leaves when he confirms the pro showed up, or on its own after 48h of silence.",
  },
  {
    from: "finished",
    to: "paid",
    trigger: "mark_received",
    actors: ["provider"],
    effect: "release_all",
    why: "Paid directly to the provider, or already paid outside: there is nothing for the app to charge.",
  },
  {
    from: "finished",
    to: "unpaid",
    trigger: "mark_unpaid",
    actors: ["system"],
    effect: "deposit_to_provider",
    why: "Seven days without paying the balance. The provider keeps the deposit and the phone number goes on the list.",
  },
  {
    from: "finished",
    to: "disputed",
    trigger: "dispute",
    actors: ["customer"],
    effect: "refund_all",
    why: "Disputed within 48h: automatic refund, no review, logged against the phone number.",
  },

  {
    from: "paid",
    to: "reviewed",
    trigger: "review",
    actors: ["customer"],
    effect: "none",
    why: "The customer left a review. End of the happy path.",
  },
  {
    from: "paid",
    to: "disputed",
    trigger: "dispute",
    actors: ["customer"],
    effect: "refund_all",
    why: "The 48h window counts from the end of the job, so a dispute still fits after payment.",
  },
] as const;

export function initialState(mustPayDeposit: boolean): BookingState {
  return mustPayDeposit ? "pending_payment" : "confirmed";
}

export function transitionsFrom(state: BookingState) {
  return TRANSITIONS.filter((rule) => rule.from === state);
}

export function findTransition(
  from: BookingState,
  trigger: Trigger,
): TransitionRule | undefined {
  return TRANSITIONS.find(
    (rule) => rule.from === from && rule.trigger === trigger,
  );
}

export function canTransition(
  from: BookingState,
  trigger: Trigger,
  actor: TransitionActor,
) {
  const rule = findTransition(from, trigger);
  return Boolean(rule && rule.actors.includes(actor));
}

const APP_MONEY_TRIGGERS: readonly Trigger[] = [
  "pay_deposit",
  "pay_balance",
  "dispute",
];

function allowedFor(booking: Pick<Booking, "depositMode">, trigger: Trigger) {
  return (
    chargesThroughApp(booking.depositMode) ||
    !APP_MONEY_TRIGGERS.includes(trigger)
  );
}

export function availableTriggers(
  booking: Pick<Booking, "state" | "depositMode">,
  actor: TransitionActor,
) {
  return transitionsFrom(booking.state)
    .filter((rule) => rule.actors.includes(actor))
    .map((rule) => rule.trigger)
    .filter((trigger) => allowedFor(booking, trigger));
}

export class InvalidTransition extends Error {
  constructor(
    readonly from: BookingState,
    readonly trigger: Trigger,
    readonly actor: TransitionActor,
  ) {
    super(
      `Invalid transition: cannot "${trigger}" from "${from}" as "${actor}".`,
    );
    this.name = "InvalidTransition";
  }
}

export type TransitionContext = {
  actor: TransitionActor;
  source: TransitionSource;
  note?: string;
};

export function applyTransition(
  booking: Booking,
  trigger: Trigger,
  context: TransitionContext,
): { booking: Booking; transition: Transition; effect: MoneyEffect } {
  const rule = findTransition(booking.state, trigger);

  if (
    !rule ||
    !rule.actors.includes(context.actor) ||
    !allowedFor(booking, trigger)
  ) {
    throw new InvalidTransition(booking.state, trigger, context.actor);
  }

  const at = nowIso();
  const transition: Transition = {
    from: booking.state,
    to: rule.to,
    at,
    actor: context.actor,
    source: context.source,
    note: context.note,
  };

  return {
    booking: {
      ...booking,
      state: rule.to,
      transitions: [...booking.transitions, transition],
      updatedAt: at,
    },
    transition,
    effect: rule.effect,
  };
}
