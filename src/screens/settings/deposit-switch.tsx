"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { cn } from "@/utils/cn";
import { MONTHLY_FEE_CENTS } from "@/utils/booking/rules";

export function DepositSwitch({
  checked,
  onChange,
  busy = false,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  busy?: boolean;
  className?: string;
}) {
  const t = useTranslations("depositSwitch");
  const id = useId();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-note ${id}-price`}
      aria-disabled={busy || undefined}
      onClick={() => {
        if (!busy) onChange(!checked);
      }}
      className={cn(
        "touchable flex w-full items-start gap-3 rounded-card border bg-white p-3 text-left transition-colors duration-200 hover:bg-paper active:bg-surface aria-disabled:opacity-60",
        checked ? "border-action" : "border-border",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span
          id={`${id}-label`}
          className="block text-body font-semibold text-ink"
        >
          {t("label")}
        </span>
        <span id={`${id}-note`} className="mt-0.5 block text-note text-gray">
          {checked ? t("on") : t("off")}
        </span>
        <span
          id={`${id}-price`}
          className="mt-1 block text-note font-medium text-ink"
        >
          {t("price", { price: MONTHLY_FEE_CENTS / 100 })}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-200",
          checked ? "border-action bg-action" : "border-border bg-surface",
        )}
      >
        <span
          className={cn(
            "size-6 rounded-full bg-white shadow-soft transition-transform duration-200",
            checked ? "translate-x-6.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
