"use client";

import { useLocale } from "next-intl";

import { TextField } from "@/components/ui/field";
import { amountText } from "@/utils/format/currency";
import type { Cents } from "@/types/booking";

const MAX_CENTS = 9_999_999;

export function MoneyField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  id?: string;
  label: string;
  hint?: string;
  value: Cents;
  onChange: (cents: Cents) => void;
  error?: string;
}) {
  const locale = useLocale();

  return (
    <TextField
      id={id}
      label={label}
      hint={hint}
      inputMode="numeric"
      autoComplete="off"
      value={value > 0 ? amountText(value, locale) : ""}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "");
        onChange(Math.min(MAX_CENTS, Number(digits || "0")));
      }}
      error={error}
      className="tabular text-lead"
    />
  );
}
