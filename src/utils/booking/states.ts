import {
  BadgeCheck,
  CircleAlert,
  CircleCheckBig,
  CircleX,
  Clock,
  Flag,
  ShieldAlert,
  Star,
  TimerOff,
  UserX,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { BookingState } from "@/types/booking";

export type StateLook = {
  icon: LucideIcon;
  chip: string;
  bar: string;
};

export const STATE_LOOK: Record<BookingState, StateLook> = {
  pending_payment: {
    icon: Clock,
    chip: "bg-orange-soft text-orange-dark border-orange",
    bar: "bg-orange",
  },
  confirmed: {
    icon: CircleCheckBig,
    chip: "bg-green-soft text-green border-green",
    bar: "bg-green",
  },
  in_progress: {
    icon: Wrench,
    chip: "bg-yellow-soft text-yellow-dark border-yellow",
    bar: "bg-yellow",
  },
  finished: {
    icon: Flag,
    chip: "bg-blue-soft text-blue border-blue",
    bar: "bg-blue",
  },
  paid: {
    icon: BadgeCheck,
    chip: "bg-green-soft text-green border-green",
    bar: "bg-green",
  },
  reviewed: {
    icon: Star,
    chip: "bg-green-soft text-green border-green",
    bar: "bg-green",
  },
  payment_expired: {
    icon: TimerOff,
    chip: "bg-surface text-ink border-border",
    bar: "bg-border",
  },
  cancelled_by_customer: {
    icon: CircleX,
    chip: "bg-red-soft text-red border-red",
    bar: "bg-red",
  },
  cancelled_by_provider: {
    icon: CircleX,
    chip: "bg-red-soft text-red border-red",
    bar: "bg-red",
  },
  customer_no_show: {
    icon: UserX,
    chip: "bg-red-soft text-red border-red",
    bar: "bg-red",
  },
  provider_no_show: {
    icon: UserX,
    chip: "bg-red-soft text-red border-red",
    bar: "bg-red",
  },
  unpaid: {
    icon: CircleAlert,
    chip: "bg-red-soft text-red border-red",
    bar: "bg-red",
  },
  disputed: {
    icon: ShieldAlert,
    chip: "bg-red-soft text-red border-red",
    bar: "bg-red",
  },
};
