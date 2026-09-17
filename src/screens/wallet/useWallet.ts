"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useMoneyReport } from "@/utils/api/queries";
import { walletHref } from "@/utils/booking/wallet";
import { isMonthKey, shiftMonthKey } from "@/utils/time/month";
import { useDismissed } from "@/utils/ui/dismissed";

export function useWallet() {
  const query = useSearchParams().get("mes") ?? undefined;
  const month = isMonthKey(query) ? query : undefined;
  const { data, loading, error } = useMoneyReport(month);
  const [flowHidden, hideFlow] = useDismissed("money-flow");
  const [asked, setAsked] = useState(false);
  const [closed, setClosed] = useState(false);
  const [gotIt, setGotIt] = useState(false);

  const current = data ? data.month === data.currentMonth : true;

  function closeFlow() {
    setAsked(false);
    setClosed(true);
    if (gotIt) hideFlow();
  }

  return {
    report: data,
    loading,
    error,
    current,
    previous:
      data && data.month > data.firstMonth
        ? shiftMonthKey(data.month, -1)
        : null,
    next: data && !current ? shiftMonthKey(data.month, 1) : null,
    listMonth: data && !current ? data.month : undefined,
    hrefFor: (key: string) =>
      walletHref(key === data?.currentMonth ? undefined : key),
    flowOpen: asked || (!flowHidden && !closed),
    flowHidden,
    openFlow: () => {
      setClosed(false);
      setAsked(true);
    },
    closeFlow,
    gotIt,
    setGotIt,
  };
}
