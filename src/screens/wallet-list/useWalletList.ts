"use client";

import { useSearchParams } from "next/navigation";

import { useMoneyEntries, useMoneyReport } from "@/utils/api/queries";
import { isMonthKey } from "@/utils/time/month";
import { MONTHLY_KINDS, type MoneyEntryKind } from "@/utils/booking/money";

export function useWalletList(kind: MoneyEntryKind) {
  const query = useSearchParams().get("mes") ?? undefined;
  const month = isMonthKey(query) ? query : undefined;
  const monthly = MONTHLY_KINDS.includes(kind);
  const report = useMoneyReport(monthly ? month : undefined);
  const entries = useMoneyEntries(kind, monthly ? month : undefined);

  const list = entries.data ?? [];

  return {
    monthly,
    loading: report.loading || entries.loading,
    report: report.data,
    list: entries.data,
    error: report.error ?? entries.error,
    pastMonth:
      monthly && Boolean(report.data) && report.data?.month !== report.data?.currentMonth,
    total: list.reduce((sum, entry) => sum + entry.amount, 0),
  };
}
