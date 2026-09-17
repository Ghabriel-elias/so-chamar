import type { Timestamp } from "@/types/booking";

const KEY = "sochamar:pending-payment";

export type RememberedPayment = {
  token: string;
  slug: string;
  dueAt?: Timestamp;
};

export function rememberPendingPayment(payment: RememberedPayment) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payment));
  } catch {
  }
}

export function readPendingPayment(): RememberedPayment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RememberedPayment) : null;
  } catch {
    return null;
  }
}

export function forgetPendingPayment() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
  }
}
