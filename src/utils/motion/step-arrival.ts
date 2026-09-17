"use client";

import { useEffect, useState } from "react";

export type StepDirection = "forward" | "back" | null;

export type StepArrival = {
  from: number | null;
  direction: StepDirection;
};

const FRESH_FOR = 30 * 60 * 1000;
const keyFor = (flow: string) => `sochamar:step:${flow}`;

function lastStep(flow: string): number | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(keyFor(flow));
    if (!raw) return null;
    const { step, at } = JSON.parse(raw) as { step: number; at: number };
    return Date.now() - at < FRESH_FOR ? step : null;
  } catch {
    return null;
  }
}

export function useStepArrival(flow: string, step: number): StepArrival {
  const [arrival] = useState<StepArrival>(() => {
    const previous = lastStep(flow);
    if (previous === null || Math.abs(previous - step) !== 1) {
      return { from: null, direction: null };
    }
    return { from: previous, direction: previous < step ? "forward" : "back" };
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        keyFor(flow),
        JSON.stringify({ step, at: Date.now() }),
      );
    } catch {
    }
  }, [flow, step]);

  return arrival;
}
