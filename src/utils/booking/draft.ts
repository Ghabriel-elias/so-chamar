"use client";

import { useCallback, useState } from "react";

import type { Timestamp } from "@/types/booking";

const KEY = "sochamar:draft";

export const BOOKING_STEPS = 4;

export type BookingDraft = {
  slug?: string;
  serviceId?: string;
  serviceName?: string;
  startsAt?: Timestamp;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  addressMode?: "cep" | "manual";
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighbourhood?: string;
  city?: string;
  state?: string;
  problemDescription?: string;
};

function read(): BookingDraft {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : {};
  } catch {
    return {};
  }
}

function save(draft: BookingDraft) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
  }
}

export function readDraft() {
  return read();
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
  }
}

export function useDraft() {
  const [draft, setDraft] = useState<BookingDraft>(() => read());

  const update = useCallback((changes: BookingDraft) => {
    setDraft((previous) => {
      const next = { ...previous, ...changes };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    clearDraft();
    setDraft({});
  }, []);

  return { draft, update, reset };
}
