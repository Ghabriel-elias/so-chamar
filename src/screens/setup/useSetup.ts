"use client";

import { useState } from "react";

import {
  useServices,
  useSession,
  useSubscription,
  useWorkingHours,
} from "@/utils/api/queries";
import type { StepDirection } from "@/utils/motion/step-arrival";

export const TOTAL = 5;

export function useSetup() {
  const sessionQuery = useSession();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<StepDirection>(null);

  function go(next: number) {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  return {
    loading: sessionQuery.loading,
    provider: sessionQuery.data,
    step,
    direction,
    go,
  };
}

export function useSetupData() {
  const subscriptionQuery = useSubscription();
  const servicesQuery = useServices();
  const hoursQuery = useWorkingHours();

  const loading =
    subscriptionQuery.loading || servicesQuery.loading || hoursQuery.loading;

  const access = subscriptionQuery.data?.access;

  return {
    loading,
    blocked: access === "blocked",
    trialEndsAt:
      access === "trial" && subscriptionQuery.data
        ? subscriptionQuery.data.subscription.nextChargeAt
        : null,
    services: servicesQuery.data ?? [],
    hours: hoursQuery.data ?? [],
    reloadServices: servicesQuery.reload,
  };
}
